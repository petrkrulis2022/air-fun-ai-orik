// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BondingCurve
 * @dev Bonding curve contract with quadratic pricing formula: price = k * sold²
 * Implements purchase function with slippage protection and fee distribution
 */
contract BondingCurve is Ownable, ReentrancyGuard {
  using SafeERC20 for IERC20;

  // Bonding curve constant (k = 0.000000001)
  uint256 public constant K = 1; // Scaled: actual k = K / 1e18
  uint256 public constant K_SCALE = 1e18;

  // Fee percentages (basis points: 10000 = 100%)
  uint256 public constant CREATOR_FEE_BPS = 9800; // 98%
  uint256 public constant PLATFORM_FEE_BPS = 200; // 2%
  uint256 public constant TOTAL_BPS = 10000;

  // Token configuration
  IERC20 public memecoin;
  IERC20 public immutable usdc;
  address public immutable creator;
  address public platformWallet;

  // Bonding curve state
  uint256 public tokensSold;
  uint256 public totalSupply;
  bool public isGraduated;
  bool public initialized;

  // Events
  event TokenPurchased(
    address indexed buyer,
    uint256 tokenAmount,
    uint256 usdcCost,
    uint256 creatorFee,
    uint256 platformFee,
    uint256 newTokensSold
  );
  event Graduated(uint256 finalTokensSold, uint256 finalMarketCap);
  event PlatformWalletUpdated(address indexed oldWallet, address indexed newWallet);
  event Initialized(address indexed memecoinAddress);

  /**
   * @dev Constructor
   * @param _usdc Address of USDC token
   * @param _creator Address of the stream creator
   * @param _platformWallet Address of the platform wallet
   * @param _totalSupply Total supply available on bonding curve
   */
  constructor(
    address _usdc,
    address _creator,
    address _platformWallet,
    uint256 _totalSupply
  ) Ownable(msg.sender) {
    require(_usdc != address(0), "Invalid USDC address");
    require(_creator != address(0), "Invalid creator address");
    require(_platformWallet != address(0), "Invalid platform wallet");
    require(_totalSupply > 0, "Total supply must be positive");

    usdc = IERC20(_usdc);
    creator = _creator;
    platformWallet = _platformWallet;
    totalSupply = _totalSupply;
    tokensSold = 0;
    isGraduated = false;
    initialized = false;
  }

  /**
   * @dev Initialize with memecoin address (only owner, once)
   * @param _memecoin Address of the memecoin token
   */
  function initialize(address _memecoin) external onlyOwner {
    require(!initialized, "Already initialized");
    require(_memecoin != address(0), "Invalid memecoin address");

    memecoin = IERC20(_memecoin);
    initialized = true;

    emit Initialized(_memecoin);
  }

  /**
   * @dev Calculate price at a given supply using formula: price = k * sold²
   * @param sold Number of tokens sold
   * @return price Price in USDC (scaled by 1e6 for USDC decimals)
   */
  function calculatePrice(uint256 sold) public pure returns (uint256) {
    // price = k * sold²
    // k = K / K_SCALE = 1 / 1e18
    // price = (sold² * K) / K_SCALE
    return (sold * sold * K) / K_SCALE;
  }

  /**
   * @dev Calculate cost to purchase tokens using integral of bonding curve
   * Cost = ∫[currentSold to currentSold+amount] k*x² dx
   *      = k * (x³/3) evaluated from currentSold to currentSold+amount
   *      = k/3 * ((currentSold+amount)³ - currentSold³)
   * @param amount Number of tokens to purchase
   * @return cost Total USDC cost
   */
  function calculatePurchaseCost(uint256 amount) public view returns (uint256) {
    require(amount > 0, "Amount must be positive");
    require(tokensSold + amount <= totalSupply, "Exceeds available supply");

    uint256 newSold = tokensSold + amount;

    // Calculate (newSold³ - tokensSold³) / 3
    uint256 newSoldCubed = newSold * newSold * newSold;
    uint256 currentSoldCubed = tokensSold * tokensSold * tokensSold;
    uint256 diff = newSoldCubed - currentSoldCubed;

    // cost = k * diff / 3 = (K * diff) / (K_SCALE * 3)
    return (K * diff) / (K_SCALE * 3);
  }

  /**
   * @dev Purchase tokens with slippage protection
   * @param tokenAmount Number of tokens to purchase
   * @param maxUsdcCost Maximum USDC willing to spend (slippage protection)
   */
  function purchase(uint256 tokenAmount, uint256 maxUsdcCost) external nonReentrant {
    require(initialized, "Not initialized");
    require(!isGraduated, "Token has graduated");
    require(tokenAmount > 0, "Amount must be positive");
    require(tokensSold + tokenAmount <= totalSupply, "Exceeds available supply");

    // Calculate cost
    uint256 usdcCost = calculatePurchaseCost(tokenAmount);
    require(usdcCost > 0, "Cost must be positive");
    require(usdcCost <= maxUsdcCost, "Slippage exceeded");

    // Calculate fees
    uint256 platformFee = (usdcCost * PLATFORM_FEE_BPS) / TOTAL_BPS;
    uint256 creatorFee = usdcCost - platformFee; // Give rounding remainder to creator

    // Verify fee distribution sums to 100%
    require(creatorFee + platformFee == usdcCost, "Fee distribution error");

    // Update state before external calls
    tokensSold += tokenAmount;

    // Transfer USDC from buyer
    usdc.safeTransferFrom(msg.sender, address(this), usdcCost);

    // Distribute fees
    usdc.safeTransfer(creator, creatorFee);
    usdc.safeTransfer(platformWallet, platformFee);

    // Transfer memecoins to buyer
    memecoin.safeTransfer(msg.sender, tokenAmount);

    emit TokenPurchased(msg.sender, tokenAmount, usdcCost, creatorFee, platformFee, tokensSold);
  }

  /**
   * @dev Get current price per token
   * @return Current price in USDC
   */
  function getCurrentPrice() external view returns (uint256) {
    return calculatePrice(tokensSold);
  }

  /**
   * @dev Get next price after purchasing 1 token
   * @return Next price in USDC
   */
  function getNextPrice() external view returns (uint256) {
    return calculatePrice(tokensSold + 1);
  }

  /**
   * @dev Calculate market cap at current price
   * @return Market cap in USDC
   */
  function getMarketCap() external view returns (uint256) {
    if (tokensSold == 0) return 0;
    return calculatePrice(tokensSold) * tokensSold;
  }

  /**
   * @dev Mark token as graduated (only owner)
   */
  function graduate() external onlyOwner {
    require(!isGraduated, "Already graduated");
    isGraduated = true;

    uint256 finalMarketCap = calculatePrice(tokensSold) * tokensSold;
    emit Graduated(tokensSold, finalMarketCap);
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

  /**
   * @dev Get remaining tokens available for purchase
   * @return Remaining token supply
   */
  function getRemainingSupply() external view returns (uint256) {
    return totalSupply - tokensSold;
  }
}
