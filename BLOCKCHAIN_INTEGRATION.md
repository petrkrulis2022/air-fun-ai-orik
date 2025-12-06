# Blockchain Integration Guide

Complete reference for integrating the air.fun smart contracts into other streaming applications.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Deployed Contracts](#deployed-contracts)
3. [Architecture](#architecture)
4. [Frontend Integration](#frontend-integration)
5. [Backend Integration](#backend-integration)
6. [Contract Functions](#contract-functions)
7. [Real-Time Deployment Modal](#real-time-deployment-modal)
8. [WebSocket Events](#websocket-events)
9. [Environment Setup](#environment-setup)
10. [Quick Reference](#quick-reference)

---

## Overview

The air.fun platform uses a dual-chain deployment strategy, supporting both **Base Sepolia** (EVM) and **Hedera Testnet** (HTS/EVM). The same contract ABIs and integration patterns work on both chains, allowing your streaming app to deploy tokens to either network.

### Key Features

- **Automatic Token Deployment**: When a stream starts, a memecoin is automatically created
- **Bonding Curve Trading**: Viewers buy/sell tokens using a bonding curve
- **Graduation to DEX**: When market cap reaches $69,000, token graduates to a liquidity pool
- **Real-Time Status**: WebSocket broadcasts deployment progress to the streamer

---

## Deployed Contracts

### Base Sepolia (Chain ID: 84532)

| Contract                   | Address                                      | Explorer                                                                                    |
| -------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **USDC** (Stablecoin)      | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | [BaseScan](https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e) |
| **AIR Token**              | `0xB2D4ED0c17487ABfEfC4d3feEE7EB860e82aA3f7` | [BaseScan](https://sepolia.basescan.org/address/0xB2D4ED0c17487ABfEfC4d3feEE7EB860e82aA3f7) |
| **Memecoin Factory**       | `0x3c4ceDfE7F0a20013B0adae70443d0102166Db54` | [BaseScan](https://sepolia.basescan.org/address/0x3c4ceDfE7F0a20013B0adae70443d0102166Db54) |
| **Liquidity Pool Factory** | `0x5834aEe88F9163a4146B3053D2Ffa34Bf53b6727` | [BaseScan](https://sepolia.basescan.org/address/0x5834aEe88F9163a4146B3053D2Ffa34Bf53b6727) |

### Hedera Testnet (Chain ID: 296)

| Contract                   | Address                                      | Token ID      | Explorer                                                                                    |
| -------------------------- | -------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------- |
| **USDh** (Stablecoin)      | `0x00000000000000000000000000000000006e24c7` | `0.0.7200455` | [HashScan](https://hashscan.io/testnet/token/0.0.7200455)                                   |
| **AIR Token**              | `0x00000000000000000000000000000000007052b7` | `0.0.7361207` | [HashScan](https://hashscan.io/testnet/token/0.0.7361207)                                   |
| **Memecoin Factory**       | `0x210542A52aF3c0A5854B75E84C67312Ffe6F004A` | -             | [HashScan](https://hashscan.io/testnet/contract/0x210542A52aF3c0A5854B75E84C67312Ffe6F004A) |
| **Liquidity Pool Factory** | `0x6796cb5394c66f194771b059c54137a9eD64cbEa` | -             | [HashScan](https://hashscan.io/testnet/contract/0x6796cb5394c66f194771b059c54137a9eD64cbEa) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              STREAMING APPLICATION                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐     WebSocket      ┌─────────────────────┐         │
│  │  STREAMER FRONTEND  │◄──────────────────►│      BACKEND        │         │
│  │  (React/Vue/etc)    │  deployment_status  │  (Node.js/Express)  │         │
│  │                     │                     │                     │         │
│  │  ┌───────────────┐  │                     │  ┌───────────────┐  │         │
│  │  │  Deployment   │  │                     │  │ TokenFactory  │  │         │
│  │  │    Modal      │◄─┼─────────────────────┼──│   Service     │  │         │
│  │  │               │  │                     │  │               │  │         │
│  │  │ • Live status │  │                     │  │ • Deploy      │  │         │
│  │  │ • TX hashes   │  │                     │  │ • Broadcast   │  │         │
│  │  │ • Addresses   │  │                     │  │ • Store DB    │  │         │
│  │  │ • Explorer    │  │                     │  │               │  │         │
│  │  │   links       │  │                     │  │               │  │         │
│  │  └───────────────┘  │                     │  └───────┬───────┘  │         │
│  └─────────────────────┘                     └──────────┼──────────┘         │
│                                                         │                    │
└─────────────────────────────────────────────────────────┼────────────────────┘
                                                          │
                                                          │ ethers.js
                                                          │
┌─────────────────────────────────────────────────────────┼────────────────────┐
│                              BLOCKCHAIN LAYER           │                    │
├─────────────────────────────────────────────────────────┼────────────────────┤
│                                                         ▼                    │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      MEMECOIN FACTORY CONTRACT                        │   │
│  │              Base: 0x3c4ceDfE7F0a20013B0adae70443d0102166Db54        │   │
│  │              Hedera: 0x210542A52aF3c0A5854B75E84C67312Ffe6F004A      │   │
│  │                                                                        │   │
│  │  createMemecoin(name, symbol, creator)                                │   │
│  │           │                                                            │   │
│  │           ▼                                                            │   │
│  │  ┌────────────────────┐    ┌────────────────────┐                     │   │
│  │  │  MEMECOIN (ERC20)  │    │   BONDING CURVE    │                     │   │
│  │  │                    │    │                    │                     │   │
│  │  │  • 1B total supply │◄──►│  • Holds 800M      │                     │   │
│  │  │  • 200M to creator │    │  • Price = k*sold² │                     │   │
│  │  │  • Standard ERC20  │    │  • USDC purchases  │                     │   │
│  │  └────────────────────┘    └─────────┬──────────┘                     │   │
│  └──────────────────────────────────────┼───────────────────────────────┘   │
│                                          │                                   │
│                                          │ At $69K market cap                │
│                                          ▼                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    LIQUIDITY POOL FACTORY                             │   │
│  │              Base: 0x5834aEe88F9163a4146B3053D2Ffa34Bf53b6727        │   │
│  │              Hedera: 0x6796cb5394c66f194771b059c54137a9eD64cbEa      │   │
│  │                                                                        │   │
│  │  createPool(memecoin, memecoinAmount, airAmount)                      │   │
│  │           │                                                            │   │
│  │           ▼                                                            │   │
│  │  ┌────────────────────────────────────────────────────────┐           │   │
│  │  │              LIQUIDITY POOL (MEMECOIN/AIR)             │           │   │
│  │  │                                                        │           │   │
│  │  │  • LP tokens burned (rug-pull protection)              │           │   │
│  │  │  • Token now tradeable on DEX                          │           │   │
│  │  │  • Permanent liquidity locked                          │           │   │
│  │  └────────────────────────────────────────────────────────┘           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Frontend Integration

### 1. Deployment Modal Component

The `BlockchainDeploymentModal` component shows real-time deployment progress to streamers.

```tsx
// components/BlockchainDeploymentModal.tsx

export interface DeploymentStep {
  id: string; // Step identifier
  label: string; // Display label
  status: "pending" | "in-progress" | "completed" | "error";
  details?: string; // Additional info
  txHash?: string; // Transaction hash
  address?: string; // Contract address
  blockNumber?: number;
  timestamp?: number;
}

export interface DeploymentInfo {
  streamId: string;
  tokenName: string;
  tokenSymbol: string;
  chain: "base" | "hedera"; // Which blockchain
  chainId: number; // 84532 or 296
  factoryAddress?: string;
  memecoinAddress?: string; // Deployed token address
  bondingCurveAddress?: string; // Deployed pool address
  creatorAddress?: string;
  creatorTokens?: string; // "200,000,000"
  steps: DeploymentStep[];
}
```

### 2. Explorer URL Helper

```typescript
const getExplorerUrl = (chain: "base" | "hedera", type: "tx" | "address", value: string) => {
  if (chain === "base") {
    return `https://sepolia.basescan.org/${type === "tx" ? "tx" : "address"}/${value}`;
  } else {
    return `https://hashscan.io/testnet/${type === "tx" ? "transaction" : "account"}/${value}`;
  }
};
```

### 3. WebSocket Subscription

```tsx
// In your stream dashboard page
const { subscribe, unsubscribe } = useWebSocket(streamId);

useEffect(() => {
  const handleDeploymentStatus = (data: any) => {
    console.log("Deployment status:", data);

    // Update deployment info state
    setDeploymentInfo((prev) => {
      if (!prev) {
        return {
          streamId: streamId,
          tokenName: data.tokenName || "Token",
          tokenSymbol: data.tokenSymbol || "",
          chain: data.chain || "base",
          chainId: data.chainId || 84532,
          steps: [],
        };
      }
      return updateDeploymentSteps(prev, data);
    });

    setShowDeploymentModal(true);
  };

  subscribe("deployment_status", handleDeploymentStatus);

  return () => {
    unsubscribe("deployment_status", handleDeploymentStatus);
  };
}, [streamId, subscribe, unsubscribe]);
```

### 4. Modal Usage

```tsx
<BlockchainDeploymentModal
  isOpen={showDeploymentModal}
  onClose={() => setShowDeploymentModal(false)}
  deploymentInfo={deploymentInfo}
/>;

{
  /* Button to reopen modal after closing */
}
{
  deploymentInfo && !showDeploymentModal && (
    <button onClick={() => setShowDeploymentModal(true)}>⛓️ View Blockchain Details</button>
  );
}
```

---

## Backend Integration

### 1. Token Factory Service

The `TokenFactoryService` handles all blockchain interactions.

```typescript
// services/token-factory.service.ts

import { ethers } from "ethers";
import { MemecoinFactoryABI } from "../contracts/abis.js";

export class TokenFactoryService {
  private baseProvider: ethers.JsonRpcProvider;
  private baseWallet: ethers.Wallet;
  private hederaProvider: ethers.JsonRpcProvider;
  private hederaWallet: ethers.Wallet;

  constructor() {
    // Base Sepolia
    this.baseProvider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    this.baseWallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, this.baseProvider);

    // Hedera Testnet (JSON-RPC relay)
    this.hederaProvider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
    this.hederaWallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, this.hederaProvider);
  }
}
```

### 2. Deploy Memecoin Function

```typescript
async deployMemecoin(
  chain: "base" | "hedera",
  name: string,
  symbol: string,
  creatorAddress: string,
  streamId: string
): Promise<{ memecoinAddress: string; bondingCurveAddress: string }> {

  const factoryAddress = chain === "base"
    ? "0x3c4ceDfE7F0a20013B0adae70443d0102166Db54"
    : "0x210542A52aF3c0A5854B75E84C67312Ffe6F004A";

  const wallet = chain === "base" ? this.baseWallet : this.hederaWallet;

  // Broadcast: Connecting to factory
  this.broadcastStatus(streamId, {
    step: "connecting_factory",
    status: "in-progress",
    chain: chain,
    chainId: chain === "base" ? 84532 : 296
  });

  const factory = new ethers.Contract(factoryAddress, MemecoinFactoryABI, wallet);

  // Broadcast: Sending transaction
  this.broadcastStatus(streamId, {
    step: "sending_transaction",
    status: "in-progress"
  });

  const tx = await factory.createMemecoin(name, symbol, creatorAddress);

  this.broadcastStatus(streamId, {
    step: "sending_transaction",
    status: "completed",
    txHash: tx.hash
  });

  // Wait for confirmation
  this.broadcastStatus(streamId, {
    step: "confirming_transaction",
    status: "in-progress"
  });

  const receipt = await tx.wait();

  // Parse event to get addresses
  const event = receipt.logs
    .map(log => factory.interface.parseLog(log))
    .find(e => e?.name === "MemecoinCreated");

  const result = {
    memecoinAddress: event.args.memecoinAddress,
    bondingCurveAddress: event.args.bondingCurveAddress
  };

  // Broadcast: Complete
  this.broadcastStatus(streamId, {
    step: "deployment_complete",
    status: "completed",
    memecoinAddress: result.memecoinAddress,
    bondingCurveAddress: result.bondingCurveAddress,
    blockNumber: receipt.blockNumber
  });

  return result;
}
```

### 3. Realtime Status Broadcasting

```typescript
// services/realtime.service.ts

broadcastDeploymentStatus(streamId: string, status: any): void {
  // Store for late-joining clients
  if (!this.deploymentStatuses.has(streamId)) {
    this.deploymentStatuses.set(streamId, []);
  }
  this.deploymentStatuses.get(streamId).push({
    ...status,
    timestamp: Date.now()
  });

  // Broadcast to all connected clients in the stream room
  this.io.to(streamId).emit("deployment_status", status);
}

// Replay events when client joins late
joinStreamRoom(socket: Socket, streamId: string): void {
  socket.join(streamId);

  // Replay any deployment events
  const deploymentEvents = this.getDeploymentStatus(streamId);
  if (deploymentEvents.length > 0) {
    for (const event of deploymentEvents) {
      socket.emit("deployment_status", event);
    }
  }
}
```

---

## Contract Functions

### Memecoin Factory

```solidity
// Create a new memecoin with bonding curve
function createMemecoin(
    string memory name,      // e.g., "Streamer Coin"
    string memory symbol,    // e.g., "STRM" (3-5 chars)
    address creator          // Receives 20% of tokens
) external returns (
    address memecoinAddress,      // The new token contract
    address bondingCurveAddress   // The bonding curve contract
)

// Emits: MemecoinCreated(memecoinAddress, bondingCurveAddress, creator, name, symbol)
```

### Bonding Curve

```solidity
// Purchase tokens with USDC
function purchase(
    uint256 tokenAmount,     // How many tokens to buy
    uint256 maxUsdcCost      // Maximum USDC to spend (slippage protection)
) external

// Calculate cost before purchase
function calculatePurchaseCost(uint256 tokenAmount)
    external view returns (uint256 usdcCost)

// Get current token price
function getCurrentPrice() external view returns (uint256)

// Sell tokens back to curve
function sell(uint256 tokenAmount, uint256 minUsdcReceived) external
```

### Liquidity Pool Factory

```solidity
// Create graduation pool (called when market cap reaches $69K)
function createPool(
    address memecoin,
    uint256 memecoinAmount,
    uint256 airAmount
) external returns (address poolAddress)

// LP tokens are automatically burned for rug-pull protection
```

---

## Real-Time Deployment Modal

### Deployment Steps Flow

```
1. generating_symbol      → "Generating Token Symbol"
2. connecting_factory     → "Connecting to Factory Contract"
3. sending_transaction    → "Sending Transaction"
4. confirming_transaction → "Confirming Transaction"
5. parsing_events         → "Processing Contract Events"
6. memecoin_deployed      → "Memecoin Contract Deployed"
7. bonding_curve_deployed → "Bonding Curve Deployed"
8. tokens_allocated       → "Creator Tokens Allocated"
9. saving_database        → "Saving to Database"
10. deployment_complete   → "Deployment Complete"
```

### Status Event Format

```typescript
interface DeploymentStatusEvent {
  step: string; // Step identifier
  status: "pending" | "in-progress" | "completed" | "error";
  chain?: "base" | "hedera"; // Blockchain being used
  chainId?: number; // 84532 or 296
  details?: string; // Human-readable details
  txHash?: string; // Transaction hash when available
  address?: string; // Contract address when deployed
  blockNumber?: number; // Confirmation block
  timestamp?: number; // Unix timestamp
  tokenSymbol?: string; // Generated symbol
  tokenName?: string; // Token name
  memecoinAddress?: string; // Final token address
  bondingCurveAddress?: string; // Final pool address
}
```

---

## WebSocket Events

### Events from Backend → Frontend

| Event                     | Description                | Payload                                  |
| ------------------------- | -------------------------- | ---------------------------------------- |
| `deployment_status`       | Token deployment progress  | `DeploymentStatusEvent`                  |
| `price-update`            | Bonding curve price change | `{ currentPrice, nextPrice, marketCap }` |
| `viewer-count`            | Viewer count update        | `{ count: number }`                      |
| `graduation_announcement` | Token graduated to DEX     | `{ poolAddress, memecoinAddress }`       |

### Socket.io Room Structure

```typescript
// Clients join a room for their stream
socket.emit("join-stream", streamId);

// Backend broadcasts to all clients in room
io.to(streamId).emit("deployment_status", payload);
```

---

## Environment Setup

### Required Environment Variables

```bash
# Network RPC URLs
BASE_RPC_URL=https://sepolia.base.org
HEDERA_RPC_URL=https://testnet.hashio.io/api

# Deployer wallet (same key works for both chains)
DEPLOYER_PRIVATE_KEY=0x...your_private_key

# Base Sepolia Contracts
BASE_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
BASE_AIR_TOKEN_ADDRESS=0xB2D4ED0c17487ABfEfC4d3feEE7EB860e82aA3f7
BASE_MEMECOIN_FACTORY_ADDRESS=0x3c4ceDfE7F0a20013B0adae70443d0102166Db54
BASE_LIQUIDITY_POOL_FACTORY_ADDRESS=0x5834aEe88F9163a4146B3053D2Ffa34Bf53b6727

# Hedera Testnet Contracts
HEDERA_USDH_ADDRESS=0x00000000000000000000000000000000006e24c7
HEDERA_AIR_TOKEN_ADDRESS=0x00000000000000000000000000000000007052b7
HEDERA_MEMECOIN_FACTORY_ADDRESS=0x210542A52aF3c0A5854B75E84C67312Ffe6F004A
HEDERA_LIQUIDITY_POOL_FACTORY_ADDRESS=0x6796cb5394c66f194771b059c54137a9eD64cbEa

# Chain selection (optional - defaults to base)
DEFAULT_CHAIN=base
```

### MetaMask Network Configuration

**Base Sepolia:**

```
Network Name: Base Sepolia
RPC URL: https://sepolia.base.org
Chain ID: 84532
Currency Symbol: ETH
Block Explorer: https://sepolia.basescan.org
```

**Hedera Testnet:**

```
Network Name: Hedera Testnet
RPC URL: https://testnet.hashio.io/api
Chain ID: 296
Currency Symbol: HBAR
Block Explorer: https://hashscan.io/testnet
```

---

## Quick Reference

### Key Parameters

| Parameter            | Value             | Description                       |
| -------------------- | ----------------- | --------------------------------- |
| Total Supply         | 1,000,000,000     | Total tokens created              |
| Creator Allocation   | 200,000,000 (20%) | Tokens sent to creator            |
| Bonding Curve Supply | 800,000,000 (80%) | Tokens available for purchase     |
| Bonding Curve K      | 0.000000001       | Price curve coefficient           |
| Graduation Threshold | $69,000           | Market cap to trigger DEX listing |
| Creator Fee          | 98%               | Creator's share of purchases      |
| Platform Fee         | 2%                | Platform's share of purchases     |

### Chain Quick Reference

| Chain          | Chain ID | Stablecoin | Factory           |
| -------------- | -------- | ---------- | ----------------- |
| Base Sepolia   | 84532    | USDC       | `0x3c4ceDfE7F...` |
| Hedera Testnet | 296      | USDh       | `0x210542A52...`  |

### Bonding Curve Formula

```
Price = K × (Tokens Sold)²

Where:
  K = 0.000000001
  Price is in USDC/USDh (6 decimals)
```

### Explorer URLs

```typescript
// Base Sepolia
`https://sepolia.basescan.org/tx/${txHash}``https://sepolia.basescan.org/address/${address}`
// Hedera Testnet
`https://hashscan.io/testnet/transaction/${txHash}``https://hashscan.io/testnet/account/${address}`;
```

---

## Integration Checklist

- [ ] Copy contract addresses from this document
- [ ] Set up environment variables
- [ ] Import `MemecoinFactoryABI` from contracts package
- [ ] Initialize ethers.js providers for Base and/or Hedera
- [ ] Implement WebSocket connection for `deployment_status` events
- [ ] Create deployment modal component
- [ ] Handle explorer links for both chains
- [ ] Test token creation flow on testnet
- [ ] Verify creator receives 20% allocation
- [ ] Test bonding curve purchases

---

## Support & Resources

- **Contract Source Code**: `packages/contracts/contracts/`
- **Contract ABIs**: `packages/backend/src/contracts/abis.ts`
- **Get Testnet Tokens**:
  - Base Sepolia ETH: [Coinbase Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
  - Hedera HBAR: [Hedera Portal](https://portal.hedera.com/)

---

**Last Updated**: December 6, 2024
