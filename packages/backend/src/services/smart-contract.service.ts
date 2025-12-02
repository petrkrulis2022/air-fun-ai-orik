/**
 * Smart Contract Service
 * Wrapper for blockchain interactions on Hedera and Base Sepolia
 * Requirements: 9, 10, 17, 23
 */

import { ethers } from "ethers";
import { ChainType, createBaseProvider, getContractAddresses } from "../config/blockchain.js";
import {
  MemecoinFactoryABI,
  BondingCurveABI,
  LiquidityPoolFactoryABI,
  ERC20ABI,
} from "../contracts/abis.js";

// Types
export interface TransactionReceipt {
  txHash: string;
  blockNumber: number;
  status: "success" | "failed";
  gasUsed: number;
}

export type TxStatus = "pending" | "confirmed" | "failed";

export type ContractEvent =
  | "TokenPurchased"
  | "TokenGraduated"
  | "LiquidityPoolCreated"
  | "FeesDistributed";

export interface Subscription {
  unsubscribe: () => void;
}

export interface PurchaseRequest {
  tokenId: string;
  buyerId: string;
  amount: number;
  maxSlippage: number;
  chain: ChainType;
}

/**
 * Smart Contract Service Class
 */
export class SmartContractService {
  private baseProvider: ethers.JsonRpcProvider;
  private baseWallet: ethers.Wallet;
  private contractAddresses: ReturnType<typeof getContractAddresses>;

  constructor() {
    const { provider, wallet } = createBaseProvider();
    this.baseProvider = provider;
    this.baseWallet = wallet;
    this.contractAddresses = getContractAddresses();
  }

  /**
   * Deploy memecoin on specified chain
   * Requirements: 5.2, 23.1, 23.2
   * @param name Token name
   * @param symbol Token symbol
   * @param creator Creator address
   * @param chain Target blockchain
   * @returns Contract addresses (memecoin and bonding curve)
   */
  async deployMemecoin(
    name: string,
    symbol: string,
    creator: string,
    chain: ChainType
  ): Promise<{ memecoinAddress: string; bondingCurveAddress: string }> {
    if (chain === "hedera") {
      return this.deployMemecoinHedera(name, symbol, creator);
    } else {
      return this.deployMemecoinBase(name, symbol, creator);
    }
  }

  /**
   * Deploy memecoin on Hedera testnet
   */
  private async deployMemecoinHedera(
    name: string,
    symbol: string,
    creator: string
  ): Promise<{ memecoinAddress: string; bondingCurveAddress: string }> {
    // For MVP, we'll use a simplified approach
    // In production, this would use Hedera Token Service (HTS)
    throw new Error("Hedera deployment not yet implemented - use Base Sepolia for MVP");
  }

  /**
   * Deploy memecoin on Base Sepolia
   */
  private async deployMemecoinBase(
    name: string,
    symbol: string,
    creator: string
  ): Promise<{ memecoinAddress: string; bondingCurveAddress: string }> {
    const factoryAddress = this.contractAddresses.base.memecoinFactory;
    if (!factoryAddress) {
      throw new Error("Memecoin factory address not configured for Base");
    }

    const factory = new ethers.Contract(factoryAddress, MemecoinFactoryABI, this.baseWallet);

    // Call createMemecoin on factory
    const tx = await factory.createMemecoin(name, symbol, creator);
    const receipt = await tx.wait();

    // Parse MemecoinCreated event
    const event = receipt.logs
      .map((log: any) => {
        try {
          return factory.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e: any) => e && e.name === "MemecoinCreated");

    if (!event) {
      throw new Error("MemecoinCreated event not found in transaction receipt");
    }

    return {
      memecoinAddress: event.args.memecoinAddress,
      bondingCurveAddress: event.args.bondingCurveAddress,
    };
  }

  /**
   * Execute bonding curve purchase
   * Requirements: 9.3, 9.5, 23.3
   * @param bondingCurveAddress Address of bonding curve contract
   * @param tokenAmount Number of tokens to purchase
   * @param maxUsdcCost Maximum USDC willing to spend
   * @param buyerAddress Address of buyer
   * @param chain Target blockchain
   * @returns Transaction hash
   */
  async executeBondingCurvePurchase(
    bondingCurveAddress: string,
    tokenAmount: string,
    maxUsdcCost: string,
    buyerAddress: string,
    chain: ChainType
  ): Promise<string> {
    if (chain === "hedera") {
      return this.executePurchaseHedera(
        bondingCurveAddress,
        tokenAmount,
        maxUsdcCost,
        buyerAddress
      );
    } else {
      return this.executePurchaseBase(bondingCurveAddress, tokenAmount, maxUsdcCost, buyerAddress);
    }
  }

  /**
   * Execute purchase on Hedera
   */
  private async executePurchaseHedera(
    bondingCurveAddress: string,
    tokenAmount: string,
    maxUsdcCost: string,
    buyerAddress: string
  ): Promise<string> {
    throw new Error("Hedera purchase not yet implemented - use Base Sepolia for MVP");
  }

  /**
   * Execute purchase on Base Sepolia
   */
  private async executePurchaseBase(
    bondingCurveAddress: string,
    tokenAmount: string,
    maxUsdcCost: string,
    buyerAddress: string
  ): Promise<string> {
    const usdcAddress = this.contractAddresses.base.usdc;
    if (!usdcAddress) {
      throw new Error("USDC address not configured for Base");
    }

    // First, approve USDC spending
    const usdc = new ethers.Contract(usdcAddress, ERC20ABI, this.baseWallet);
    const approveTx = await usdc.approve(bondingCurveAddress, maxUsdcCost);
    await approveTx.wait();

    // Execute purchase
    const bondingCurve = new ethers.Contract(bondingCurveAddress, BondingCurveABI, this.baseWallet);

    const tx = await bondingCurve.purchase(tokenAmount, maxUsdcCost);
    const receipt = await tx.wait();

    return receipt.hash;
  }

  /**
   * Create liquidity pool for graduated token
   * Requirements: 12.2, 12.3, 23.5
   * @param memecoinAddress Address of memecoin
   * @param creator Creator address
   * @param memecoinAmount Amount of memecoin to add
   * @param airAmount Amount of AIR to add
   * @param chain Target blockchain
   * @returns Pool address
   */
  async createLiquidityPool(
    memecoinAddress: string,
    creator: string,
    memecoinAmount: string,
    airAmount: string,
    chain: ChainType
  ): Promise<string> {
    if (chain === "hedera") {
      return this.createPoolHedera(memecoinAddress, creator, memecoinAmount, airAmount);
    } else {
      return this.createPoolBase(memecoinAddress, creator, memecoinAmount, airAmount);
    }
  }

  /**
   * Create pool on Hedera
   */
  private async createPoolHedera(
    memecoinAddress: string,
    creator: string,
    memecoinAmount: string,
    airAmount: string
  ): Promise<string> {
    throw new Error("Hedera pool creation not yet implemented - use Base Sepolia for MVP");
  }

  /**
   * Create pool on Base Sepolia
   */
  private async createPoolBase(
    memecoinAddress: string,
    creator: string,
    memecoinAmount: string,
    airAmount: string
  ): Promise<string> {
    const factoryAddress = this.contractAddresses.base.liquidityPoolFactory;
    if (!factoryAddress) {
      throw new Error("Liquidity pool factory address not configured for Base");
    }

    const factory = new ethers.Contract(factoryAddress, LiquidityPoolFactoryABI, this.baseWallet);

    // Approve tokens
    const memecoin = new ethers.Contract(memecoinAddress, ERC20ABI, this.baseWallet);
    const airToken = new ethers.Contract(
      this.contractAddresses.base.airToken!,
      ERC20ABI,
      this.baseWallet
    );

    await (await memecoin.approve(factoryAddress, memecoinAmount)).wait();
    await (await airToken.approve(factoryAddress, airAmount)).wait();

    // Create pool
    const tx = await factory.createLiquidityPool(
      memecoinAddress,
      creator,
      memecoinAmount,
      airAmount
    );
    const receipt = await tx.wait();

    // Parse PoolCreated event
    const event = receipt.logs
      .map((log: any) => {
        try {
          return factory.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e: any) => e && e.name === "PoolCreated");

    if (!event) {
      throw new Error("PoolCreated event not found in transaction receipt");
    }

    return event.args.poolAddress;
  }

  /**
   * Burn LP tokens to prevent rug pulls
   * Requirements: 12.3
   * @param poolAddress Address of liquidity pool
   * @param chain Target blockchain
   * @returns Transaction hash
   */
  async burnLPTokens(poolAddress: string, chain: ChainType): Promise<string> {
    if (chain === "hedera") {
      throw new Error("Hedera LP burn not yet implemented - use Base Sepolia for MVP");
    }

    const factoryAddress = this.contractAddresses.base.liquidityPoolFactory;
    if (!factoryAddress) {
      throw new Error("Liquidity pool factory address not configured for Base");
    }

    const factory = new ethers.Contract(factoryAddress, LiquidityPoolFactoryABI, this.baseWallet);

    const tx = await factory.burnLPTokens(poolAddress);
    const receipt = await tx.wait();

    return receipt.hash;
  }

  /**
   * Transfer creator fees
   * Requirements: 10.4, 10.5
   * @param streamerAddress Streamer wallet address
   * @param amount Amount in USDC
   * @param chain Target blockchain
   * @returns Transaction hash
   */
  async transferCreatorFees(
    streamerAddress: string,
    amount: string,
    chain: ChainType
  ): Promise<string> {
    if (chain === "hedera") {
      throw new Error("Hedera fee transfer not yet implemented - use Base Sepolia for MVP");
    }

    const usdcAddress = this.contractAddresses.base.usdc;
    if (!usdcAddress) {
      throw new Error("USDC address not configured for Base");
    }

    const usdc = new ethers.Contract(usdcAddress, ERC20ABI, this.baseWallet);
    const tx = await usdc.transfer(streamerAddress, amount);
    const receipt = await tx.wait();

    return receipt.hash;
  }

  /**
   * Transfer platform fees
   * Requirements: 10.4, 10.5
   * @param amount Amount in USDC
   * @param chain Target blockchain
   * @returns Transaction hash
   */
  async transferPlatformFees(amount: string, chain: ChainType): Promise<string> {
    const platformWallet = process.env.PLATFORM_WALLET_ADDRESS;
    if (!platformWallet) {
      throw new Error("Platform wallet address not configured");
    }

    return this.transferCreatorFees(platformWallet, amount, chain);
  }

  /**
   * Wait for transaction confirmation
   * Requirements: 17.1, 17.2, 17.3, 17.4
   * @param txHash Transaction hash
   * @param chain Target blockchain
   * @param timeoutMs Timeout in milliseconds (default 60s)
   * @returns Transaction receipt
   */
  async waitForConfirmation(
    txHash: string,
    chain: ChainType,
    timeoutMs: number = 60000
  ): Promise<TransactionReceipt> {
    if (chain === "hedera") {
      throw new Error("Hedera confirmation not yet implemented - use Base Sepolia for MVP");
    }

    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < timeoutMs) {
      try {
        const receipt = await this.baseProvider.getTransactionReceipt(txHash);

        if (receipt) {
          return {
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            status: receipt.status === 1 ? "success" : "failed",
            gasUsed: Number(receipt.gasUsed),
          };
        }
      } catch (error) {
        // Transaction not found yet, continue polling
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Transaction confirmation timeout after ${timeoutMs}ms`);
  }

  /**
   * Get transaction status
   * Requirements: 17.1, 17.2, 17.3, 17.4
   * @param txHash Transaction hash
   * @param chain Target blockchain
   * @returns Transaction status
   */
  async getTransactionStatus(txHash: string, chain: ChainType): Promise<TxStatus> {
    if (chain === "hedera") {
      throw new Error("Hedera status check not yet implemented - use Base Sepolia for MVP");
    }

    try {
      const receipt = await this.baseProvider.getTransactionReceipt(txHash);

      if (receipt) {
        return receipt.status === 1 ? "confirmed" : "failed";
      }

      // Check if transaction exists in mempool
      const tx = await this.baseProvider.getTransaction(txHash);
      if (tx) {
        return "pending";
      }

      return "failed";
    } catch (error) {
      return "failed";
    }
  }

  /**
   * Subscribe to contract events
   * Requirements: 11, 12, 14
   * @param chain Target blockchain
   * @param eventType Event type to listen for
   * @param callback Callback function
   * @returns Subscription object
   */
  subscribeToContractEvents(
    chain: ChainType,
    eventType: ContractEvent,
    callback: (event: any) => void
  ): Subscription {
    if (chain === "hedera") {
      throw new Error("Hedera event subscription not yet implemented - use Base Sepolia for MVP");
    }

    let contract: ethers.Contract;
    let eventName: string;

    // Determine which contract and event to listen to
    switch (eventType) {
      case "TokenPurchased":
        // Listen to all bonding curve contracts
        // For MVP, we'll need to track deployed contracts
        throw new Error("TokenPurchased event subscription requires contract tracking");

      case "TokenGraduated":
        throw new Error("TokenGraduated event subscription requires contract tracking");

      case "LiquidityPoolCreated":
        const factoryAddress = this.contractAddresses.base.liquidityPoolFactory;
        if (!factoryAddress) {
          throw new Error("Liquidity pool factory address not configured");
        }
        contract = new ethers.Contract(factoryAddress, LiquidityPoolFactoryABI, this.baseProvider);
        eventName = "PoolCreated";
        break;

      default:
        throw new Error(`Unsupported event type: ${eventType}`);
    }

    // Subscribe to event
    contract.on(eventName, callback);

    return {
      unsubscribe: () => {
        contract.off(eventName, callback);
      },
    };
  }

  /**
   * Get bonding curve state
   * @param bondingCurveAddress Address of bonding curve
   * @param chain Target blockchain
   * @returns Bonding curve state
   */
  async getBondingCurveState(bondingCurveAddress: string, chain: ChainType) {
    if (chain === "hedera") {
      throw new Error("Hedera state query not yet implemented - use Base Sepolia for MVP");
    }

    const bondingCurve = new ethers.Contract(
      bondingCurveAddress,
      BondingCurveABI,
      this.baseProvider
    );

    const [
      tokensSold,
      totalSupply,
      currentPrice,
      nextPrice,
      marketCap,
      remainingSupply,
      isGraduated,
    ] = await Promise.all([
      bondingCurve.tokensSold(),
      bondingCurve.totalSupply(),
      bondingCurve.getCurrentPrice(),
      bondingCurve.getNextPrice(),
      bondingCurve.getMarketCap(),
      bondingCurve.getRemainingSupply(),
      bondingCurve.isGraduated(),
    ]);

    return {
      tokensSold: tokensSold.toString(),
      totalSupply: totalSupply.toString(),
      currentPrice: currentPrice.toString(),
      nextPrice: nextPrice.toString(),
      marketCap: marketCap.toString(),
      remainingSupply: remainingSupply.toString(),
      isGraduated,
    };
  }

  /**
   * Check graduation eligibility
   * @param memecoinAddress Address of memecoin
   * @param currentPrice Current price per token
   * @param tokensSold Number of tokens sold
   * @param chain Target blockchain
   * @returns True if eligible for graduation
   */
  async checkGraduationEligibility(
    memecoinAddress: string,
    currentPrice: string,
    tokensSold: string,
    chain: ChainType
  ): Promise<boolean> {
    if (chain === "hedera") {
      throw new Error("Hedera graduation check not yet implemented - use Base Sepolia for MVP");
    }

    const factoryAddress = this.contractAddresses.base.liquidityPoolFactory;
    if (!factoryAddress) {
      throw new Error("Liquidity pool factory address not configured for Base");
    }

    const factory = new ethers.Contract(factoryAddress, LiquidityPoolFactoryABI, this.baseProvider);

    return factory.checkGraduationEligibility(memecoinAddress, currentPrice, tokensSold);
  }
}

// Export singleton instance
export const smartContractService = new SmartContractService();
