# User Flows & Platform Economics

Complete guide to user interactions, token economics, and fund flows in the air.fun platform.

---

## 📋 Table of Contents

1. [Platform Overview](#platform-overview)
2. [Streamer Flow](#streamer-flow)
3. [Viewer Flow](#viewer-flow)
4. [Platform Flow](#platform-flow)
5. [Token Economics](#token-economics)
6. [Wallet & Fund Distribution](#wallet--fund-distribution)
7. [Graduation to DEX](#graduation-to-dex)
8. [Stablecoin Integration](#stablecoin-integration)

---

## Platform Overview

air.fun is a decentralized livestreaming platform where:

- **Streamers** create streams and automatically get a memecoin deployed
- **Viewers** support streamers by purchasing memecoins on a bonding curve
- **Platform** facilitates the infrastructure and takes a small fee

### Supported Blockchains

| Chain          | Stablecoin | Platform Token |
| -------------- | ---------- | -------------- |
| Base Sepolia   | USDC       | AIR            |
| Hedera Testnet | USDh       | AIR            |

---

## Streamer Flow

### 1. Authentication & Wallet Connection

```
┌──────────────────────────────────────────────────────────────────┐
│  STREAMER CONNECTS WALLET                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Streamer opens app → Clicks "Connect Wallet"                 │
│  2. MetaMask/WalletConnect popup appears                         │
│  3. Streamer signs authentication message (no gas cost)          │
│  4. Backend verifies signature → Issues JWT token                │
│  5. Streamer wallet address is now linked to their account       │
│                                                                  │
│  ┌─────────────────┐                                             │
│  │ Streamer Wallet │ ← This is the CREATOR wallet                │
│  │ 0xABC...123     │   All creator fees go HERE                  │
│  └─────────────────┘                                             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2. Stream Creation & Token Deployment

When a streamer creates a stream, the following happens **automatically**:

```
┌──────────────────────────────────────────────────────────────────┐
│  STREAM CREATION FLOW                                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Streamer fills form                                     │
│  ├── Stream Title: "My Awesome Stream"                           │
│  ├── Description: "..."                                          │
│  └── Thumbnail (optional)                                        │
│                                                                  │
│  Step 2: Backend generates token symbol                          │
│  ├── Takes streamer name → "MYAWE" (3-5 chars)                   │
│  └── Checks for collisions, adds suffix if needed                │
│                                                                  │
│  Step 3: Smart contract deployment (PLATFORM PAYS GAS)           │
│  ├── Platform's deployer wallet sends transaction                │
│  ├── MemecoinFactory.createMemecoin() is called                  │
│  └── Two contracts are deployed:                                 │
│                                                                  │
│      ┌─────────────────────────────────────────────┐             │
│      │           MEMECOIN CONTRACT                 │             │
│      │  • 1 Billion total supply                   │             │
│      │  • 200M (20%) → Streamer's wallet           │             │
│      │  • 800M (80%) → BondingCurve contract       │             │
│      └─────────────────────────────────────────────┘             │
│                                                                  │
│      ┌─────────────────────────────────────────────┐             │
│      │         BONDING CURVE CONTRACT              │             │
│      │  • Holds 800M tokens for sale               │             │
│      │  • Price formula: price = k × sold²         │             │
│      │  • Accepts USDC/USDh payments               │             │
│      │  • Distributes fees automatically           │             │
│      └─────────────────────────────────────────────┘             │
│                                                                  │
│  Step 4: Real-time status shown in modal                         │
│  ├── ✅ Generating Token Symbol                                  │
│  ├── ✅ Connecting to Factory Contract                           │
│  ├── ✅ Sending Transaction (TX: 0x...)                          │
│  ├── ⏳ Confirming Transaction                                   │
│  ├── ✅ Memecoin Contract Deployed                               │
│  ├── ✅ Bonding Curve Deployed                                   │
│  ├── ✅ Creator Tokens Allocated (200M → streamer)               │
│  └── ✅ Deployment Complete!                                     │
│                                                                  │
│  Step 5: Stream goes live                                        │
│  └── Viewers can now join and purchase tokens                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### What Streamer Receives on Stream Creation

| Item               | Amount            | Destination                 |
| ------------------ | ----------------- | --------------------------- |
| Memecoin Tokens    | 200,000,000 (20%) | Streamer's connected wallet |
| Bonding Curve Link | -                 | Stored in database          |
| Stream URL         | -                 | Shareable link              |

### 3. Earning from Viewer Purchases

Every time a viewer buys tokens:

```
Viewer pays 100 USDC
        │
        ▼
┌───────────────────────────────────────┐
│         BONDING CURVE CONTRACT         │
│                                        │
│  Split: 98% / 2%                       │
│                                        │
│  ┌─────────────────────────────────┐   │
│  │ 98 USDC → Streamer's Wallet     │   │
│  │ (Creator Fee)                   │   │
│  └─────────────────────────────────┘   │
│                                        │
│  ┌─────────────────────────────────┐   │
│  │ 2 USDC → Platform Wallet        │   │
│  │ (Platform Fee)                  │   │
│  └─────────────────────────────────┘   │
│                                        │
│  Tokens sent to viewer                 │
└───────────────────────────────────────┘
```

**Key Point**: Streamer earns USDC/USDh directly to their wallet in real-time, with every purchase!

---

## Viewer Flow

### 1. Discovering & Joining Streams

```
┌──────────────────────────────────────────────────────────────────┐
│  VIEWER DISCOVERY FLOW                                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Viewer opens app → Sees live stream grid                     │
│  2. Each stream card shows:                                      │
│     ├── Thumbnail/Preview                                        │
│     ├── Streamer name                                            │
│     ├── Viewer count                                             │
│     ├── Token symbol & current price                             │
│     └── Market cap                                               │
│                                                                  │
│  3. Viewer clicks stream → Stream view page loads                │
│  4. Video player + bonding curve chart displayed                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2. Connecting Wallet & Buying Tokens

```
┌──────────────────────────────────────────────────────────────────┐
│  VIEWER PURCHASE FLOW                                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Connect wallet (if not connected)                       │
│  ├── Click "Connect Wallet"                                      │
│  ├── Sign authentication message                                 │
│  └── Wallet connected: 0xDEF...456                               │
│                                                                  │
│  Step 2: Approve USDC spending (first time only)                 │
│  ├── Click "Approve USDC"                                        │
│  ├── MetaMask popup: Approve BondingCurve to spend USDC          │
│  └── Confirm transaction (viewer pays gas)                       │
│                                                                  │
│  Step 3: Purchase tokens                                         │
│  ├── Enter amount: "Buy 1,000 tokens"                            │
│  ├── UI shows: Cost = X USDC                                     │
│  ├── Set slippage tolerance (default 2%)                         │
│  ├── Click "Purchase"                                            │
│  ├── MetaMask popup: Confirm transaction                         │
│  └── Confirm transaction (viewer pays gas)                       │
│                                                                  │
│  Step 4: Transaction confirmed                                   │
│  ├── Tokens appear in viewer's wallet                            │
│  ├── Bonding curve chart updates                                 │
│  ├── Price increases for next buyer                              │
│  └── Real-time notification shown to all viewers                 │
│                                                                  │
│  FUND FLOW:                                                      │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Viewer Wallet                                           │    │
│  │  └── Sends: X USDC (to BondingCurve contract)            │    │
│  │  └── Receives: Y Memecoin tokens                         │    │
│  │  └── Pays: Gas fee in ETH/HBAR                           │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Viewer Gas Costs

| Action          | Who Pays Gas? | Estimated Cost |
| --------------- | ------------- | -------------- |
| Connect wallet  | No gas        | Free           |
| Approve USDC    | Viewer        | ~0.001 ETH     |
| Purchase tokens | Viewer        | ~0.002 ETH     |
| View stream     | No gas        | Free           |

---

## Platform Flow

### Platform Wallet

```
Platform Wallet: 0x97b83759eadb2503a8947e8d6eb734795cdefc95
```

### What Platform Handles

```
┌──────────────────────────────────────────────────────────────────┐
│  PLATFORM RESPONSIBILITIES                                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. DEPLOYMENT (Platform pays gas)                               │
│  ├── Deployer wallet: Platform's hot wallet                      │
│  ├── Deploys: MemecoinFactory.createMemecoin()                   │
│  ├── Cost: ~0.01 ETH per deployment                              │
│  └── Streamer pays: NOTHING for deployment                       │
│                                                                  │
│  2. FEE COLLECTION (Automatic via smart contract)                │
│  ├── Every purchase: 2% goes to platform wallet                  │
│  ├── In USDC/USDh (stablecoin)                                   │
│  └── No manual claiming needed                                   │
│                                                                  │
│  3. INFRASTRUCTURE                                               │
│  ├── Backend servers                                             │
│  ├── WebRTC/mediasoup media servers                              │
│  ├── Database (Supabase)                                         │
│  ├── Redis caching                                               │
│  └── S3 storage for thumbnails                                   │
│                                                                  │
│  4. GRADUATION (Future - Platform triggers)                      │
│  ├── Monitor market caps                                         │
│  ├── Trigger graduation when $69K reached                        │
│  └── Create liquidity pool                                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Platform Revenue Model

```
Revenue = 2% of all token purchases

Example:
├── Stream has $100,000 total purchases
├── Platform receives: $2,000 USDC
└── Deposited directly to platform wallet
```

---

## Token Economics

### Token Distribution

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN DISTRIBUTION                            │
│                    Total: 1,000,000,000                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                                                           │   │
│  │   ████████████████████  200M (20%)                        │   │
│  │   CREATOR ALLOCATION                                      │   │
│  │   → Sent to streamer's wallet on deployment               │   │
│  │   → Streamer can hold, sell, or distribute                │   │
│  │                                                           │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                                                           │   │
│  │   ████████████████████████████████████████████████████    │   │
│  │   ████████████████████████████████████████████████████    │   │
│  │   ████████████████████████████████  800M (80%)            │   │
│  │   BONDING CURVE SUPPLY                                    │   │
│  │   → Held in BondingCurve contract                         │   │
│  │   → Sold to viewers via bonding curve                     │   │
│  │   → Price increases as more are sold                      │   │
│  │                                                           │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Bonding Curve Formula

```
Price = K × (Tokens Sold)²

Where:
  K = 0.000000001 (1e-9)

Example prices:
  After 1,000 tokens sold:    $0.000001
  After 10,000 tokens sold:   $0.0001
  After 100,000 tokens sold:  $0.01
  After 1,000,000 tokens sold: $1.00
```

### Fee Distribution

```
┌─────────────────────────────────────────────────────────────────┐
│  FEE DISTRIBUTION ON EVERY PURCHASE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   USDC/USDh paid by viewer                                       │
│            │                                                     │
│            ▼                                                     │
│   ┌────────────────────────────────────────────────────────┐    │
│   │              BONDING CURVE CONTRACT                     │    │
│   │                                                         │    │
│   │   ┌────────────────────────────────────────────────┐    │    │
│   │   │  98% → STREAMER WALLET (Creator Fee)           │    │    │
│   │   │  Instant transfer to creator address           │    │    │
│   │   │  In USDC (Base) or USDh (Hedera)               │    │    │
│   │   └────────────────────────────────────────────────┘    │    │
│   │                                                         │    │
│   │   ┌────────────────────────────────────────────────┐    │    │
│   │   │  2% → PLATFORM WALLET (Platform Fee)           │    │    │
│   │   │  0x97b83759eadb2503a8947e8d6eb734795cdefc95    │    │    │
│   │   │  In USDC (Base) or USDh (Hedera)               │    │    │
│   │   └────────────────────────────────────────────────┘    │    │
│   │                                                         │    │
│   │   Memecoin tokens sent to viewer                        │    │
│   └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Wallet & Fund Distribution

### All Wallets Involved

| Wallet                    | Purpose                    | Receives                               |
| ------------------------- | -------------------------- | -------------------------------------- |
| **Streamer Wallet**       | Creator's connected wallet | 200M tokens + 98% of all purchase fees |
| **Platform Wallet**       | air.fun treasury           | 2% of all purchase fees                |
| **Deployer Wallet**       | Backend hot wallet         | Nothing (pays deployment gas)          |
| **Viewer Wallet**         | Buyer's wallet             | Memecoin tokens                        |
| **BondingCurve Contract** | Holds tokens for sale      | Nothing (passes through)               |

### Money Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      COMPLETE MONEY FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ON STREAM CREATION:                                             │
│                                                                  │
│  Platform Deployer Wallet                                        │
│  └── Pays: ~0.01 ETH gas                                         │
│                                                                  │
│  MemecoinFactory Contract                                        │
│  └── Deploys: Memecoin + BondingCurve                            │
│                                                                  │
│  Memecoin Contract                                               │
│  └── Mints: 1 Billion tokens                                     │
│      ├── 200M → Streamer Wallet (creator allocation)             │
│      └── 800M → BondingCurve Contract                            │
│                                                                  │
│  ─────────────────────────────────────────────────────────────   │
│                                                                  │
│  ON EACH TOKEN PURCHASE:                                         │
│                                                                  │
│  Viewer Wallet                                                   │
│  ├── Sends: X USDC/USDh → BondingCurve                           │
│  └── Pays: Gas fee (ETH/HBAR)                                    │
│                                                                  │
│  BondingCurve Contract (instant distribution)                    │
│  ├── 98% USDC → Streamer Wallet                                  │
│  ├── 2% USDC → Platform Wallet                                   │
│  └── Y Tokens → Viewer Wallet                                    │
│                                                                  │
│  ─────────────────────────────────────────────────────────────   │
│                                                                  │
│  ON GRADUATION ($69K market cap):                                │
│                                                                  │
│  LiquidityPoolFactory Contract                                   │
│  └── Creates: Memecoin/AIR liquidity pool                        │
│                                                                  │
│  Remaining BondingCurve tokens + AIR tokens                      │
│  └── Sent to: Liquidity Pool                                     │
│                                                                  │
│  LP Tokens                                                       │
│  └── Burned: To 0x000...dead (rug-pull protection)               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Graduation to DEX

### When Graduation Happens

```
Graduation Threshold: $69,000 Market Cap

Market Cap = Current Price × Tokens Sold

When market cap reaches $69K:
├── Platform backend detects threshold
├── Triggers LiquidityPoolFactory.createLiquidityPool()
└── Token becomes tradeable on DEX
```

### Graduation Process

```
┌─────────────────────────────────────────────────────────────────┐
│                    GRADUATION FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Market cap reaches $69,000                                   │
│                                                                  │
│  2. BondingCurve.graduate() is called                            │
│     └── Marks token as graduated                                 │
│     └── No more purchases allowed on bonding curve               │
│                                                                  │
│  3. LiquidityPoolFactory.createLiquidityPool() is called         │
│     Parameters:                                                  │
│     ├── memecoinAddress: The graduated token                     │
│     ├── creator: Streamer's wallet                               │
│     ├── memecoinAmount: Remaining tokens in bonding curve        │
│     └── airAmount: Matching AIR tokens from platform             │
│                                                                  │
│  4. Liquidity Pool created                                       │
│     ├── Pool Address: New contract                               │
│     ├── Contains: Memecoin + AIR pair                            │
│     └── Trading: Now possible via AMM                            │
│                                                                  │
│  5. LP tokens burned                                             │
│     └── Prevents rug pull (liquidity locked forever)             │
│                                                                  │
│  6. Token now tradeable                                          │
│     ├── Buy/Sell on DEX                                          │
│     ├── Price determined by AMM formula                          │
│     └── No more bonding curve pricing                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Post-Graduation Trading

After graduation:

- Bonding curve is closed (no purchases)
- Token trades against AIR in liquidity pool
- Standard AMM pricing (x \* y = k)
- Anyone can provide additional liquidity (optional)

---

## Stablecoin Integration

### USDC on Base Sepolia

```
Address: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
Decimals: 6
Usage: All token purchases on Base
```

### USDh on Hedera Testnet

```
Address: 0x00000000000000000000000000000000006e24c7
Token ID: 0.0.7200455
Decimals: 6
Usage: All token purchases on Hedera
```

### Stablecoin Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    STABLECOIN FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  VIEWER (has USDC/USDh in wallet)                                │
│  │                                                               │
│  │ 1. Approve BondingCurve to spend USDC                         │
│  │    USDC.approve(bondingCurveAddress, amount)                  │
│  │                                                               │
│  │ 2. Purchase tokens                                            │
│  │    BondingCurve.purchase(tokenAmount, maxCost)                │
│  │                                                               │
│  ▼                                                               │
│  BONDING CURVE CONTRACT                                          │
│  │                                                               │
│  │ 1. Pulls USDC from viewer                                     │
│  │    USDC.transferFrom(viewer, bondingCurve, cost)              │
│  │                                                               │
│  │ 2. Calculates fee split                                       │
│  │    creatorFee = cost * 98%                                    │
│  │    platformFee = cost * 2%                                    │
│  │                                                               │
│  │ 3. Distributes USDC                                           │
│  │    USDC.transfer(creator, creatorFee)                         │
│  │    USDC.transfer(platformWallet, platformFee)                 │
│  │                                                               │
│  │ 4. Sends tokens to viewer                                     │
│  │    Memecoin.transfer(viewer, tokenAmount)                     │
│  │                                                               │
│  ▼                                                               │
│  RESULT:                                                         │
│  ├── Viewer: Has memecoin tokens                                 │
│  ├── Streamer: Has 98% of payment in USDC/USDh                   │
│  └── Platform: Has 2% of payment in USDC/USDh                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary: Who Gets What

### On Stream Creation

| Recipient | What They Get        | Who Pays                      |
| --------- | -------------------- | ----------------------------- |
| Streamer  | 200M memecoin tokens | Free (platform pays gas)      |
| Platform  | Nothing yet          | Pays ~0.01 ETH deployment gas |
| Viewers   | Nothing yet          | -                             |

### On Every Token Purchase

| Recipient | What They Get                | Source                |
| --------- | ---------------------------- | --------------------- |
| Viewer    | Memecoin tokens              | BondingCurve contract |
| Streamer  | 98% of purchase in USDC/USDh | Viewer's payment      |
| Platform  | 2% of purchase in USDC/USDh  | Viewer's payment      |

### On Graduation

| Recipient        | What They Get           |
| ---------------- | ----------------------- |
| Liquidity Pool   | Remaining tokens + AIR  |
| LP Token Holders | Nothing (tokens burned) |
| Everyone         | Tradeable token on DEX  |

---

## Quick Reference

### Key Addresses (Base Sepolia)

```
Platform Wallet:       0x97b83759eadb2503a8947e8d6eb734795cdefc95
USDC:                  0x036CbD53842c5426634e7929541eC2318f3dCF7e
AIR Token:             0xB2D4ED0c17487ABfEfC4d3feEE7EB860e82aA3f7
Memecoin Factory:      0x3c4ceDfE7F0a20013B0adae70443d0102166Db54
Liquidity Pool Factory: 0x5834aEe88F9163a4146B3053D2Ffa34Bf53b6727
```

### Key Parameters

| Parameter            | Value             |
| -------------------- | ----------------- |
| Total Token Supply   | 1,000,000,000     |
| Creator Allocation   | 200,000,000 (20%) |
| Bonding Curve Supply | 800,000,000 (80%) |
| Creator Fee          | 98%               |
| Platform Fee         | 2%                |
| Graduation Threshold | $69,000           |
| Bonding Curve K      | 0.000000001       |

---

**Last Updated**: December 10, 2024
