// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LiquidityPool
 * @dev Simple AMM liquidity pool for MEMECOIN/AIR pair
 * Implements constant product formula: x * y = k
 */
contract LiquidityPool is ERC20, ReentrancyGuard {
  IERC20 public immutable token0; // Memecoin
  IERC20 public immutable token1; // AIR token

  uint256 public reserve0;
  uint256 public reserve1;

  event LiquidityAdded(
    address indexed provider,
    uint256 amount0,
    uint256 amount1,
    uint256 liquidity
  );
  event Swap(
    address indexed trader,
    uint256 amount0In,
    uint256 amount1In,
    uint256 amount0Out,
    uint256 amount1Out
  );
  event Sync(uint256 reserve0, uint256 reserve1);

  constructor(
    address _token0,
    address _token1,
    string memory name,
    string memory symbol
  ) ERC20(name, symbol) {
    require(_token0 != address(0), "Invalid token0");
    require(_token1 != address(0), "Invalid token1");
    require(_token0 != _token1, "Identical tokens");

    token0 = IERC20(_token0);
    token1 = IERC20(_token1);
  }

  /**
   * @dev Add liquidity to the pool
   * @param amount0 Amount of token0 to add
   * @param amount1 Amount of token1 to add
   * @return liquidity LP tokens minted
   */
  function addLiquidity(
    uint256 amount0,
    uint256 amount1
  ) external nonReentrant returns (uint256 liquidity) {
    require(amount0 > 0 && amount1 > 0, "Insufficient amounts");

    // Transfer tokens to pool
    token0.transferFrom(msg.sender, address(this), amount0);
    token1.transferFrom(msg.sender, address(this), amount1);

    // Calculate liquidity to mint
    uint256 _totalSupply = totalSupply();
    if (_totalSupply == 0) {
      // Initial liquidity
      liquidity = sqrt(amount0 * amount1);
      require(liquidity > 0, "Insufficient liquidity minted");
    } else {
      // Proportional liquidity
      liquidity = min((amount0 * _totalSupply) / reserve0, (amount1 * _totalSupply) / reserve1);
    }

    require(liquidity > 0, "Insufficient liquidity minted");

    // Mint LP tokens
    _mint(msg.sender, liquidity);

    // Update reserves
    _update(token0.balanceOf(address(this)), token1.balanceOf(address(this)));

    emit LiquidityAdded(msg.sender, amount0, amount1, liquidity);
  }

  /**
   * @dev Swap tokens
   * @param amount0Out Amount of token0 to receive
   * @param amount1Out Amount of token1 to receive
   */
  function swap(uint256 amount0Out, uint256 amount1Out, address to) external nonReentrant {
    require(amount0Out > 0 || amount1Out > 0, "Insufficient output amount");
    require(amount0Out < reserve0 && amount1Out < reserve1, "Insufficient liquidity");
    require(to != address(0), "Invalid recipient");

    // Transfer tokens out
    if (amount0Out > 0) token0.transfer(to, amount0Out);
    if (amount1Out > 0) token1.transfer(to, amount1Out);

    // Get balances after transfer
    uint256 balance0 = token0.balanceOf(address(this));
    uint256 balance1 = token1.balanceOf(address(this));

    // Calculate amounts in
    uint256 amount0In = balance0 > reserve0 - amount0Out ? balance0 - (reserve0 - amount0Out) : 0;
    uint256 amount1In = balance1 > reserve1 - amount1Out ? balance1 - (reserve1 - amount1Out) : 0;

    require(amount0In > 0 || amount1In > 0, "Insufficient input amount");

    // Verify constant product formula (with 0.3% fee)
    uint256 balance0Adjusted = (balance0 * 1000) - (amount0In * 3);
    uint256 balance1Adjusted = (balance1 * 1000) - (amount1In * 3);
    require(
      balance0Adjusted * balance1Adjusted >= reserve0 * reserve1 * (1000 ** 2),
      "K invariant violated"
    );

    // Update reserves
    _update(balance0, balance1);

    emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out);
  }

  /**
   * @dev Update reserves
   */
  function _update(uint256 balance0, uint256 balance1) private {
    reserve0 = balance0;
    reserve1 = balance1;
    emit Sync(reserve0, reserve1);
  }

  /**
   * @dev Square root function (Babylonian method)
   */
  function sqrt(uint256 y) internal pure returns (uint256 z) {
    if (y > 3) {
      z = y;
      uint256 x = y / 2 + 1;
      while (x < z) {
        z = x;
        x = (y / x + x) / 2;
      }
    } else if (y != 0) {
      z = 1;
    }
  }

  /**
   * @dev Minimum of two numbers
   */
  function min(uint256 a, uint256 b) internal pure returns (uint256) {
    return a < b ? a : b;
  }
}

/**
 * @title LiquidityPoolFactory
 * @dev Factory contract to create liquidity pools for graduated memecoins
 * Requirements:
 * - Create MEMECOIN/AIR liquidity pools (Requirement 12.2)
 * - Burn LP tokens for rug-pull protection (Requirement 12.3)
 * - Check graduation threshold ($69k market cap) (Requirement 12.1)
 */
contract LiquidityPoolFactory is Ownable, ReentrancyGuard {
  // Graduation threshold: $69,000 in USDC (6 decimals)
  uint256 public constant GRADUATION_THRESHOLD = 69_000 * 10 ** 6;

  address public immutable airToken;
  address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

  // Tracking deployed pools
  struct PoolInfo {
    address poolAddress;
    address memecoinAddress;
    address creator;
    uint256 memecoinReserve;
    uint256 airReserve;
    uint256 lpTokensBurned;
    uint256 createdAt;
    bool lpTokensBurnedFlag;
  }

  mapping(address => address) public memecoinToPool;
  mapping(address => PoolInfo) public poolInfo;
  address[] public allPools;

  // Events
  event PoolCreated(
    address indexed poolAddress,
    address indexed memecoinAddress,
    address indexed creator,
    uint256 memecoinReserve,
    uint256 airReserve,
    uint256 timestamp
  );

  event LPTokensBurned(
    address indexed poolAddress,
    address indexed memecoinAddress,
    uint256 lpTokensBurned,
    uint256 timestamp
  );

  event GraduationThresholdChecked(
    address indexed memecoinAddress,
    uint256 marketCap,
    bool eligible
  );

  /**
   * @dev Constructor
   * @param _airToken Address of AIR platform token
   */
  constructor(address _airToken) Ownable(msg.sender) {
    require(_airToken != address(0), "Invalid AIR token address");
    airToken = _airToken;
  }

  /**
   * @dev Check if a memecoin is eligible for graduation
   * @param memecoinAddress Address of the memecoin
   * @param currentPrice Current price per token in USDC (6 decimals)
   * @param tokensSold Number of tokens sold
   * @return eligible True if market cap >= $69,000
   */
  function checkGraduationEligibility(
    address memecoinAddress,
    uint256 currentPrice,
    uint256 tokensSold
  ) public returns (bool eligible) {
    require(memecoinAddress != address(0), "Invalid memecoin address");

    // Calculate market cap: price * tokensSold
    // currentPrice is in USDC (6 decimals)
    // tokensSold is in token decimals (18 decimals)
    // marketCap = (currentPrice * tokensSold) / 10^18
    uint256 marketCap = (currentPrice * tokensSold) / 10 ** 18;

    eligible = marketCap >= GRADUATION_THRESHOLD;

    emit GraduationThresholdChecked(memecoinAddress, marketCap, eligible);

    return eligible;
  }

  /**
   * @dev Create a liquidity pool for a graduated memecoin
   * @param memecoinAddress Address of the memecoin
   * @param creator Address of the stream creator
   * @param memecoinAmount Amount of memecoin to add to pool
   * @param airAmount Amount of AIR tokens to add to pool
   * @return poolAddress Address of created liquidity pool
   */
  function createLiquidityPool(
    address memecoinAddress,
    address creator,
    uint256 memecoinAmount,
    uint256 airAmount
  ) external onlyOwner nonReentrant returns (address poolAddress) {
    require(memecoinAddress != address(0), "Invalid memecoin address");
    require(creator != address(0), "Invalid creator address");
    require(memecoinAmount > 0, "Memecoin amount must be positive");
    require(airAmount > 0, "AIR amount must be positive");
    require(memecoinToPool[memecoinAddress] == address(0), "Pool already exists");

    // Get memecoin symbol for LP token name
    string memory memecoinSymbol = ERC20(memecoinAddress).symbol();
    string memory lpName = string(abi.encodePacked(memecoinSymbol, "/AIR LP"));
    string memory lpSymbol = string(abi.encodePacked(memecoinSymbol, "-AIR-LP"));

    // Deploy liquidity pool
    LiquidityPool pool = new LiquidityPool(memecoinAddress, airToken, lpName, lpSymbol);
    poolAddress = address(pool);

    // Transfer tokens from owner to this contract
    IERC20(memecoinAddress).transferFrom(msg.sender, address(this), memecoinAmount);
    IERC20(airToken).transferFrom(msg.sender, address(this), airAmount);

    // Approve pool to spend tokens
    IERC20(memecoinAddress).approve(poolAddress, memecoinAmount);
    IERC20(airToken).approve(poolAddress, airAmount);

    // Add initial liquidity
    uint256 lpTokens = pool.addLiquidity(memecoinAmount, airAmount);

    // Store pool info
    PoolInfo memory info = PoolInfo({
      poolAddress: poolAddress,
      memecoinAddress: memecoinAddress,
      creator: creator,
      memecoinReserve: memecoinAmount,
      airReserve: airAmount,
      lpTokensBurned: lpTokens,
      createdAt: block.timestamp,
      lpTokensBurnedFlag: false
    });

    memecoinToPool[memecoinAddress] = poolAddress;
    poolInfo[poolAddress] = info;
    allPools.push(poolAddress);

    emit PoolCreated(
      poolAddress,
      memecoinAddress,
      creator,
      memecoinAmount,
      airAmount,
      block.timestamp
    );

    // Automatically burn LP tokens
    _burnLPTokens(poolAddress);

    return poolAddress;
  }

  /**
   * @dev Burn LP tokens to prevent rug pulls (internal)
   * @param poolAddress Address of the liquidity pool
   */
  function _burnLPTokens(address poolAddress) internal {
    PoolInfo storage info = poolInfo[poolAddress];
    require(info.poolAddress != address(0), "Pool does not exist");
    require(!info.lpTokensBurnedFlag, "LP tokens already burned");

    LiquidityPool pool = LiquidityPool(poolAddress);
    uint256 lpBalance = pool.balanceOf(address(this));
    require(lpBalance > 0, "No LP tokens to burn");

    // Transfer LP tokens to burn address
    pool.transfer(BURN_ADDRESS, lpBalance);

    // Update pool info
    info.lpTokensBurnedFlag = true;
    info.lpTokensBurned = lpBalance;

    emit LPTokensBurned(poolAddress, info.memecoinAddress, lpBalance, block.timestamp);
  }

  /**
   * @dev Burn LP tokens to prevent rug pulls (external, only owner)
   * @param poolAddress Address of the liquidity pool
   */
  function burnLPTokens(address poolAddress) external onlyOwner {
    _burnLPTokens(poolAddress);
  }

  /**
   * @dev Get pool address for a memecoin
   * @param memecoinAddress Address of the memecoin
   * @return Pool address (address(0) if not found)
   */
  function getPoolByMemecoin(address memecoinAddress) external view returns (address) {
    return memecoinToPool[memecoinAddress];
  }

  /**
   * @dev Get pool information
   * @param poolAddress Address of the pool
   * @return Pool info struct
   */
  function getPoolInfo(address poolAddress) external view returns (PoolInfo memory) {
    return poolInfo[poolAddress];
  }

  /**
   * @dev Get total number of pools created
   * @return Total count
   */
  function getTotalPools() external view returns (uint256) {
    return allPools.length;
  }

  /**
   * @dev Check if LP tokens have been burned for a pool
   * @param poolAddress Address of the pool
   * @return True if LP tokens burned
   */
  function areLPTokensBurned(address poolAddress) external view returns (bool) {
    return poolInfo[poolAddress].lpTokensBurnedFlag;
  }
}
