/**
 * Contract ABIs
 * Loaded from compiled contract artifacts
 */

// Memecoin ABI (ERC20 with bonding curve integration)
export const MemecoinABI = [
  "constructor(string name_, string symbol_, address creator_, address bondingCurve_)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function TOTAL_SUPPLY() view returns (uint256)",
  "function BONDING_CURVE_SUPPLY() view returns (uint256)",
  "function bondingCurve() view returns (address)",
  "function creator() view returns (address)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

// BondingCurve ABI
export const BondingCurveABI = [
  "constructor(address _usdc, address _creator, address _platformWallet, uint256 _totalSupply)",
  "function initialize(address _memecoin)",
  "function purchase(uint256 tokenAmount, uint256 maxUsdcCost)",
  "function calculatePrice(uint256 sold) view returns (uint256)",
  "function calculatePurchaseCost(uint256 amount) view returns (uint256)",
  "function getCurrentPrice() view returns (uint256)",
  "function getNextPrice() view returns (uint256)",
  "function getMarketCap() view returns (uint256)",
  "function getRemainingSupply() view returns (uint256)",
  "function graduate()",
  "function updatePlatformWallet(address newPlatformWallet)",
  "function K() view returns (uint256)",
  "function K_SCALE() view returns (uint256)",
  "function CREATOR_FEE_BPS() view returns (uint256)",
  "function PLATFORM_FEE_BPS() view returns (uint256)",
  "function TOTAL_BPS() view returns (uint256)",
  "function memecoin() view returns (address)",
  "function usdc() view returns (address)",
  "function creator() view returns (address)",
  "function platformWallet() view returns (address)",
  "function tokensSold() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function isGraduated() view returns (bool)",
  "function initialized() view returns (bool)",
  "event TokenPurchased(address indexed buyer, uint256 tokenAmount, uint256 usdcCost, uint256 creatorFee, uint256 platformFee, uint256 newTokensSold)",
  "event Graduated(uint256 finalTokensSold, uint256 finalMarketCap)",
  "event PlatformWalletUpdated(address indexed oldWallet, address indexed newWallet)",
  "event Initialized(address indexed memecoinAddress)",
];

// MemecoinFactory ABI
export const MemecoinFactoryABI = [
  "constructor(address _usdcAddress, address _platformWallet)",
  "function createMemecoin(string name, string symbol, address creator) returns (address memecoinAddress, address bondingCurveAddress)",
  "function getCreatorMemecoins(address creator) view returns (tuple(address memecoinAddress, address bondingCurveAddress, address creator, string symbol, uint256 deployedAt)[])",
  "function getMemecoinBySymbol(string symbol) view returns (address)",
  "function getTotalMemecoins() view returns (uint256)",
  "function updatePlatformWallet(address newPlatformWallet)",
  "function BONDING_CURVE_K() view returns (uint256)",
  "function BONDING_CURVE_SUPPLY() view returns (uint256)",
  "function usdcAddress() view returns (address)",
  "function platformWallet() view returns (address)",
  "event MemecoinCreated(address indexed memecoinAddress, address indexed bondingCurveAddress, address indexed creator, string name, string symbol, uint256 totalSupply, uint256 bondingCurveSupply)",
  "event PlatformWalletUpdated(address indexed oldWallet, address indexed newWallet)",
];

// LiquidityPoolFactory ABI
export const LiquidityPoolFactoryABI = [
  "constructor(address _airToken)",
  "function checkGraduationEligibility(address memecoinAddress, uint256 currentPrice, uint256 tokensSold) returns (bool eligible)",
  "function createLiquidityPool(address memecoinAddress, address creator, uint256 memecoinAmount, uint256 airAmount) returns (address poolAddress)",
  "function burnLPTokens(address poolAddress)",
  "function getPoolByMemecoin(address memecoinAddress) view returns (address)",
  "function getPoolInfo(address poolAddress) view returns (tuple(address poolAddress, address memecoinAddress, address creator, uint256 memecoinReserve, uint256 airReserve, uint256 lpTokensBurned, uint256 createdAt, bool lpTokensBurnedFlag))",
  "function getTotalPools() view returns (uint256)",
  "function areLPTokensBurned(address poolAddress) view returns (bool)",
  "function GRADUATION_THRESHOLD() view returns (uint256)",
  "function airToken() view returns (address)",
  "function BURN_ADDRESS() view returns (address)",
  "event PoolCreated(address indexed poolAddress, address indexed memecoinAddress, address indexed creator, uint256 memecoinReserve, uint256 airReserve, uint256 timestamp)",
  "event LPTokensBurned(address indexed poolAddress, address indexed memecoinAddress, uint256 lpTokensBurned, uint256 timestamp)",
  "event GraduationThresholdChecked(address indexed memecoinAddress, uint256 marketCap, bool eligible)",
];

// AIRToken ABI (ERC20)
export const AIRTokenABI = [
  "constructor()",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function INITIAL_SUPPLY() view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

// ERC20 ABI (for USDC and other tokens)
export const ERC20ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];
