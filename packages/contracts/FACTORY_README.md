# Memecoin Factory Contracts

This directory contains the smart contracts for the air.fun memecoin factory system.

## Overview

The factory system automatically creates memecoins with bonding curves when streamers start their streams. Each memecoin has:

- **Total Supply**: 1 billion tokens
- **Bonding Curve Supply**: 800 million tokens (available for purchase)
- **Creator Supply**: 200 million tokens (allocated to streamer)
- **Bonding Curve Formula**: price = k × sold² where k = 0.000000001

## Contracts

### Memecoin.sol

ERC20 token contract for streamer memecoins.

**Features**:

- Standard ERC20 implementation
- Fixed supply of 1 billion tokens
- Automatic distribution: 800M to bonding curve, 200M to creator
- Immutable creator and bonding curve addresses

### BondingCurve.sol

Bonding curve contract implementing quadratic pricing.

**Features**:

- Quadratic pricing formula: price = k × sold²
- Slippage protection on purchases
- Fee distribution: 98% to creator, 2% to platform
- Graduation support (token can be marked as graduated)
- Two-step initialization to handle circular dependency

**Key Functions**:

- `calculatePrice(sold)`: Calculate price at given supply
- `calculatePurchaseCost(amount)`: Calculate total cost for purchase
- `purchase(tokenAmount, maxUsdcCost)`: Execute token purchase
- `initialize(memecoinAddress)`: Set memecoin address (one-time)

### MemecoinFactory.sol

Factory contract for deploying memecoins with bonding curves.

**Features**:

- One-transaction deployment of memecoin + bonding curve
- Symbol uniqueness validation (3-5 characters)
- Tracking of all deployed memecoins
- Platform wallet management

**Key Functions**:

- `createMemecoin(name, symbol, creator)`: Deploy new memecoin with bonding curve
- `getCreatorMemecoins(creator)`: Get all memecoins by creator
- `getMemecoinBySymbol(symbol)`: Look up memecoin by symbol
- `getTotalMemecoins()`: Get total number of memecoins created

## Deployment

### Base Sepolia

```bash
npm run deploy:factory:base
```

This will deploy the MemecoinFactory to Base Sepolia testnet.

**Environment Variables Required**:

- `BASE_SEPOLIA_RPC_URL`: RPC endpoint for Base Sepolia
- `BASE_SEPOLIA_PRIVATE_KEY`: Deployer private key
- `BASE_USDC_ADDRESS`: USDC token address (default: 0x036CbD53842c5426634e7929541eC2318f3dCF7e)
- `PLATFORM_WALLET_ADDRESS`: Platform fee recipient address
- `BASESCAN_API_KEY`: (optional) For contract verification

### Hedera Testnet

```bash
npm run deploy:factory:hedera
```

This will deploy the MemecoinFactory to Hedera testnet.

**Environment Variables Required**:

- `HEDERA_ACCOUNT_ID`: Hedera account ID (e.g., 0.0.12345)
- `HEDERA_PRIVATE_KEY`: Hedera account private key
- `HEDERA_USDC_TOKEN_ID`: USDC token ID on Hedera
- `HEDERA_PLATFORM_WALLET`: Platform fee recipient account ID

## Testing

Run all tests:

```bash
npm test
```

Run specific test file:

```bash
npx hardhat test test/MemecoinFactory.test.ts
```

### Test Coverage

**Unit Tests** (18 tests):

- Factory deployment configuration
- Memecoin creation with correct supply distribution
- Symbol validation (3-5 characters, uniqueness)
- Creator tracking and lookup
- Platform wallet management

**Property-Based Tests** (6 tests):

- Property 1: Bonding Curve Price Monotonicity
- Property 2: Fee Distribution Correctness

## Usage Example

```typescript
import { ethers } from "hardhat";

// Get factory contract
const factory = await ethers.getContractAt("MemecoinFactory", FACTORY_ADDRESS);

// Create a new memecoin
const tx = await factory.createMemecoin(
  "Streamer John Coin", // name
  "JOHN", // symbol (3-5 chars)
  creatorAddress // creator address
);

const receipt = await tx.wait();

// Get deployed addresses from event
const event = receipt.logs.find((log) => log.fragment?.name === "MemecoinCreated");
const memecoinAddress = event.args[0];
const bondingCurveAddress = event.args[1];

console.log("Memecoin deployed at:", memecoinAddress);
console.log("Bonding curve deployed at:", bondingCurveAddress);
```

## Architecture

### Deployment Flow

1. **Deploy BondingCurve**: Create bonding curve contract without memecoin address
2. **Deploy Memecoin**: Create memecoin with bonding curve address
   - Mints 1 billion tokens
   - Transfers 800M to bonding curve
   - Transfers 200M to creator
3. **Initialize BondingCurve**: Set memecoin address in bonding curve
4. **Transfer Ownership**: Transfer bonding curve ownership to factory owner

### Circular Dependency Solution

The memecoin needs the bonding curve address in its constructor, and the bonding curve needs the memecoin address. We solve this with two-step initialization:

1. Deploy bonding curve first (without memecoin address)
2. Deploy memecoin with bonding curve address
3. Call `initialize()` on bonding curve to set memecoin address

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 5.2**: Deploy token contract on both Hedera testnet and Base Sepolia ✅
- **Requirement 5.3**: Set total supply to 1 billion tokens with 800 million on bonding curve ✅
- **Requirement 5.4**: Initialize bonding curve with k = 0.000000001 ✅

## Security Considerations

- **Symbol Uniqueness**: Factory prevents duplicate symbols
- **Access Control**: Only factory owner can update platform wallet
- **Initialization**: Bonding curve can only be initialized once
- **Fee Distribution**: Verified to always sum to 100%
- **Reentrancy Protection**: BondingCurve uses ReentrancyGuard

## Gas Optimization

- Immutable variables where possible (creator, bondingCurve, usdc)
- Efficient storage layout
- Minimal external calls during deployment

## Future Enhancements

- [ ] Support for custom bonding curve parameters
- [ ] Multi-signature platform wallet management
- [ ] Pausable factory for emergency stops
- [ ] Batch memecoin creation
- [ ] Integration with liquidity pool factory for graduation
