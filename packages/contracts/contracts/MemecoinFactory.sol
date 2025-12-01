// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Memecoin.sol";
import "./BondingCurve.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MemecoinFactory
 * @dev Factory contract to deploy new memecoins with bonding curves
 * Automatically creates:
 * 1. Memecoin ERC20 token (1 billion supply)
 * 2. BondingCurve contract (800 million tokens available)
 *
 * Requirements:
 * - Token creation with 1 billion supply (Requirement 5.3)
 * - Set bonding curve parameters k = 0.000000001 (Requirement 5.4)
 * - Deploy factory to both chains (Requirement 5.2)
 */
contract MemecoinFactory is Ownable {
  // Bonding curve constant (k = 0.000000001)
  uint256 public constant BONDING_CURVE_K = 1; // Scaled: actual k = K / 1e18
  uint256 public constant BONDING_CURVE_SUPPLY = 800_000_000 * 10 ** 18; // 800 million tokens

  address public immutable usdcAddress;
  address public platformWallet;

  // Tracking deployed memecoins
  struct MemecoinDeployment {
    address memecoinAddress;
    address bondingCurveAddress;
    address creator;
    string symbol;
    uint256 deployedAt;
  }

  mapping(address => MemecoinDeployment[]) public creatorMemecoins;
  mapping(string => address) public symbolToMemecoin;
  MemecoinDeployment[] public allMemecoins;

  // Events
  event MemecoinCreated(
    address indexed memecoinAddress,
    address indexed bondingCurveAddress,
    address indexed creator,
    string name,
    string symbol,
    uint256 totalSupply,
    uint256 bondingCurveSupply
  );

  event PlatformWalletUpdated(address indexed oldWallet, address indexed newWallet);

  /**
   * @dev Constructor
   * @param _usdcAddress Address of USDC token
   * @param _platformWallet Address of platform wallet for fees
   */
  constructor(address _usdcAddress, address _platformWallet) Ownable(msg.sender) {
    require(_usdcAddress != address(0), "Invalid USDC address");
    require(_platformWallet != address(0), "Invalid platform wallet");

    usdcAddress = _usdcAddress;
    platformWallet = _platformWallet;
  }

  /**
   * @dev Create a new memecoin with bonding curve
   * @param name Token name (e.g., "Streamer John Coin")
   * @param symbol Token symbol (e.g., "JOHN420")
   * @param creator Address of the stream creator
   * @return memecoinAddress Address of deployed memecoin
   * @return bondingCurveAddress Address of deployed bonding curve
   */
  function createMemecoin(
    string memory name,
    string memory symbol,
    address creator
  ) external returns (address memecoinAddress, address bondingCurveAddress) {
    require(creator != address(0), "Invalid creator address");
    require(
      bytes(symbol).length >= 3 && bytes(symbol).length <= 5,
      "Symbol must be 3-5 characters"
    );
    require(symbolToMemecoin[symbol] == address(0), "Symbol already exists");

    // Step 1: Deploy bonding curve without memecoin address
    BondingCurve bondingCurve = new BondingCurve(
      usdcAddress,
      creator,
      platformWallet,
      BONDING_CURVE_SUPPLY
    );
    bondingCurveAddress = address(bondingCurve);

    // Step 2: Deploy memecoin with bonding curve address
    Memecoin memecoin = new Memecoin(name, symbol, creator, bondingCurveAddress);
    memecoinAddress = address(memecoin);

    // Step 3: Initialize bonding curve with memecoin address
    bondingCurve.initialize(memecoinAddress);

    // Step 4: Transfer ownership of bonding curve to factory owner
    bondingCurve.transferOwnership(owner());

    // Store deployment info
    MemecoinDeployment memory deployment = MemecoinDeployment({
      memecoinAddress: memecoinAddress,
      bondingCurveAddress: bondingCurveAddress,
      creator: creator,
      symbol: symbol,
      deployedAt: block.timestamp
    });

    creatorMemecoins[creator].push(deployment);
    symbolToMemecoin[symbol] = memecoinAddress;
    allMemecoins.push(deployment);

    emit MemecoinCreated(
      memecoinAddress,
      bondingCurveAddress,
      creator,
      name,
      symbol,
      1_000_000_000 * 10 ** 18,
      BONDING_CURVE_SUPPLY
    );

    return (memecoinAddress, bondingCurveAddress);
  }

  /**
   * @dev Get all memecoins created by a specific creator
   * @param creator Address of the creator
   * @return Array of memecoin deployments
   */
  function getCreatorMemecoins(
    address creator
  ) external view returns (MemecoinDeployment[] memory) {
    return creatorMemecoins[creator];
  }

  /**
   * @dev Get memecoin address by symbol
   * @param symbol Token symbol
   * @return Address of memecoin (address(0) if not found)
   */
  function getMemecoinBySymbol(string memory symbol) external view returns (address) {
    return symbolToMemecoin[symbol];
  }

  /**
   * @dev Get total number of memecoins created
   * @return Total count
   */
  function getTotalMemecoins() external view returns (uint256) {
    return allMemecoins.length;
  }

  /**
   * @dev Update platform wallet (only owner)
   * @param newPlatformWallet New platform wallet address
   */
  function updatePlatformWallet(address newPlatformWallet) external onlyOwner {
    require(newPlatformWallet != address(0), "Invalid address");
    address oldWallet = platformWallet;
    platformWallet = newPlatformWallet;
    emit PlatformWalletUpdated(oldWallet, newPlatformWallet);
  }
}
