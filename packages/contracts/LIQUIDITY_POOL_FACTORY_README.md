# Liquidity Pool Factory

## Overview

The `LiquidityPoolFactory` contract creates liquidity pools for graduated memecoins that have reached the $69,000 market cap threshold. It implements the following features:

1. **Graduation Threshold Check**: Validates that a memecoin has reached $69,000 market cap before creating a liquidity pool
2. **MEMECOIN/AIR Pool Creation**: Creates a constant product AMM (x \* y = k) liquidity pool pairing the memecoin with AIR platform token
3. **LP Token Burning**: Automatically burns all LP tokens to prevent rug pulls and ensure permanent liquidity

## Requirements Implemented

- **Requirement 12.1**: Check graduation threshold ($69k market cap)
- **Requirement 12.2**: Create liquidity pool pairing memecoin with AIR platform token
- **Requirement 12.3**: Burn LP tokens for rug-pull protection

## Contract Architecture

### LiquidityPool Contract

A simple AMM implementation with:

- Constant product formula: `x * y = k`
- 0.3% swap fee
- ERC-20 LP tokens
- Add liquidity and swap functions

### LiquidityPoolFactory Contract

Factory contract that:

- Checks graduation eligibility based on market cap
- Deploys new liquidity pools
- Automatically burns LP tokens after pool creation
- Tracks all deployed pools

## Key Functions

### `checkGraduationEligibility(address memecoinAddress, uint256 currentPrice, uint256 tokensSold)`

Checks if a memecoin is eligible for graduation by calculating market cap:

- Market cap = currentPrice × tokensSold
- Returns `true` if market cap ≥ $69,000

**Parameters:**

- `memecoinAddress`: Address of the memecoin
- `currentPrice`: Current price per token in USDC (6 decimals)
- `tokensSold`: Number of tokens sold (18 decimals)

**Returns:**

- `eligible`: Boolean indicating if token can graduate

### `createLiquidityPool(address memecoinAddress, address creator, uint256 memecoinAmount, uint256 airAmount)`

Creates a new liquidity pool for a graduated memecoin:

1. Validates inputs and checks pool doesn't already exist
2. Deploys new `LiquidityPool` contract
3. Adds initial liquidity (memecoin + AIR tokens)
4. Automatically burns all LP tokens
5. Stores pool information

**Parameters:**

- `memecoinAddress`: Address of the graduated memecoin
- `creator`: Address of the stream creator
- `memecoinAmount`: Amount of memecoin to add to pool
- `airAmount`: Amount of AIR tokens to add to pool

**Returns:**

- `poolAddress`: Address of the created liquidity pool

**Access:** Only owner (factory deployer)

### `burnLPTokens(address poolAddress)`

Burns LP tokens for a specific pool (if not already burned).

**Parameters:**

- `poolAddress`: Address of the liquidity pool

**Access:** Only owner

## Deployment

### Base Sepolia

```bash
# Deploy AIR token first (if not already deployed)
npx hardhat run scripts/deploy-air-base.ts --network base-sepolia

# Deploy LiquidityPoolFactory
npx hardhat run scripts/deploy-pool-factory-base.ts --network base-sepolia
```

### Hedera Testnet

```bash
# Deploy AIR token first (if not already deployed)
npx hardhat run scripts/deploy-air-hedera.ts --network hedera-testnet

# Deploy LiquidityPoolFactory
npx hardhat run scripts/deploy-pool-factory-hedera.ts --network hedera-testnet
```

## Environment Variables

Add these to your `.env` file after deployment:

```bash
# AIR Token Addresses (required before deploying factory)
BASE_AIR_TOKEN_ADDRESS=0x...
HEDERA_AIR_TOKEN_ADDRESS=0x...

# Liquidity Pool Factory Addresses (after deployment)
BASE_LIQUIDITY_POOL_FACTORY_ADDRESS=0x...
HEDERA_LIQUIDITY_POOL_FACTORY_ADDRESS=0x...
```

## Usage Example

```typescript
import { ethers } from "hardhat";

// Get factory contract
const factory = await ethers.getContractAt(
  "LiquidityPoolFactory",
  process.env.BASE_LIQUIDITY_POOL_FACTORY_ADDRESS
);

// Check if token is eligible for graduation
const currentPrice = ethers.parseUnits("0.001", 6); // $0.001 USDC
const tokensSold = ethers.parseEther("100000000"); // 100M tokens
const eligible = await factory.checkGraduationEligibility(
  memecoinAddress,
  currentPrice,
  tokensSold
);

if (eligible) {
  // Create liquidity pool
  const memecoinAmount = ethers.parseEther("200000000"); // 200M tokens
  const airAmount = ethers.parseEther("10000"); // 10K AIR tokens

  const tx = await factory.createLiquidityPool(
    memecoinAddress,
    creatorAddress,
    memecoinAmount,
    airAmount
  );

  const receipt = await tx.wait();
  console.log("Pool created:", receipt);
}
```

## Security Features

1. **Reentrancy Protection**: Uses OpenZeppelin's `ReentrancyGuard`
2. **Access Control**: Only owner can create pools and burn LP tokens
3. **LP Token Burning**: Automatic burning prevents rug pulls
4. **Validation**: Comprehensive input validation and checks
5. **Constant Product Formula**: Proven AMM design with 0.3% fee

## Constants

- `GRADUATION_THRESHOLD`: 69,000 USDC (69,000 × 10^6)
- `BURN_ADDRESS`: 0x000000000000000000000000000000000000dEaD

## Events

### `PoolCreated`

Emitted when a new liquidity pool is created.

### `LPTokensBurned`

Emitted when LP tokens are burned.

### `GraduationThresholdChecked`

Emitted when graduation eligibility is checked.

## Testing

Run the test suite:

```bash
npx hardhat test test/LiquidityPoolFactory.test.ts
```

## Notes

- The factory must be funded with memecoin and AIR tokens before creating pools
- LP tokens are automatically burned to the burn address (0x...dEaD)
- Once LP tokens are burned, liquidity is permanently locked
- The graduation threshold is hardcoded to $69,000 USDC
- Market cap calculation: `(currentPrice × tokensSold) / 10^18`
