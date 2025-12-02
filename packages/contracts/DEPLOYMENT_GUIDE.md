# Contract Deployment Guide

This guide explains how to deploy all smart contracts to Hedera testnet and Base Sepolia.

## Prerequisites

1. **Hedera Testnet Account**
   - Create an account at https://portal.hedera.com/
   - Get your Account ID (format: 0.0.XXXXX)
   - Get your Private Key

2. **Base Sepolia Wallet**
   - Set up a wallet (MetaMask, etc.)
   - Get testnet ETH from https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
   - Export your private key

3. **Token Addresses**
   - Base Sepolia USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
   - Hedera Testnet USDh: `0x00000000000000000000000000000000006e24c7`

## Configuration

1. Copy the environment template:

   ```bash
   cd packages/contracts
   cp .env.example .env
   ```

2. Fill in your credentials in `.env`:

   ```env
   # Hedera Testnet
   HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
   HEDERA_PRIVATE_KEY=your_hedera_private_key

   # Base Sepolia
   BASE_SEPOLIA_PRIVATE_KEY=your_base_sepolia_private_key
   BASESCAN_API_KEY=your_basescan_api_key  # Optional, for verification

   # Platform Wallet (optional, will use deployer if not set)
   PLATFORM_WALLET_ADDRESS=your_platform_wallet_address
   ```

## Deployment Steps

### Option 1: Deploy All Contracts (Recommended)

Deploy all contracts to both chains in one command:

```bash
npm run deploy:all
```

This will deploy in the following order:

1. AIR Token → Base Sepolia
2. AIR Token → Hedera Testnet
3. Memecoin Factory → Base Sepolia
4. Memecoin Factory → Hedera Testnet
5. Liquidity Pool Factory → Base Sepolia
6. Liquidity Pool Factory → Hedera Testnet

### Option 2: Deploy Individually

#### Step 1: Compile Contracts

```bash
npm run compile
```

#### Step 2: Deploy AIR Tokens

```bash
# Base Sepolia
npm run deploy:air:base

# Hedera Testnet
npm run deploy:air:hedera
```

#### Step 3: Deploy Memecoin Factories

```bash
# Base Sepolia
npm run deploy:factory:base

# Hedera Testnet
npm run deploy:factory:hedera
```

#### Step 4: Deploy Liquidity Pool Factories

```bash
# Base Sepolia
npm run deploy:pool-factory:base

# Hedera Testnet
npm run deploy:pool-factory:hedera
```

## Post-Deployment

### 1. Update Environment Variables

After deployment, update the following files with the deployed contract addresses:

**packages/contracts/.env:**

```env
HEDERA_AIR_TOKEN_ADDRESS=<deployed_address>
BASE_AIR_TOKEN_ADDRESS=<deployed_address>
HEDERA_MEMECOIN_FACTORY_ADDRESS=<deployed_address>
BASE_MEMECOIN_FACTORY_ADDRESS=<deployed_address>
HEDERA_LIQUIDITY_POOL_FACTORY_ADDRESS=<deployed_address>
BASE_LIQUIDITY_POOL_FACTORY_ADDRESS=<deployed_address>
```

**packages/backend/.env:**

```env
# Hedera
HEDERA_AIR_TOKEN_ADDRESS=<deployed_address>
HEDERA_MEMECOIN_FACTORY_ADDRESS=<deployed_address>
HEDERA_LIQUIDITY_POOL_FACTORY_ADDRESS=<deployed_address>
HEDERA_USDH_ADDRESS=0x00000000000000000000000000000000006e24c7

# Base Sepolia
BASE_AIR_TOKEN_ADDRESS=<deployed_address>
BASE_MEMECOIN_FACTORY_ADDRESS=<deployed_address>
BASE_LIQUIDITY_POOL_FACTORY_ADDRESS=<deployed_address>
BASE_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### 2. Verify Contracts

**Base Sepolia:**

- Contracts are automatically verified if `BASESCAN_API_KEY` is set
- View on BaseScan: https://sepolia.basescan.org/

**Hedera Testnet:**

- View on HashScan: https://hashscan.io/testnet/

### 3. Test Deployment

Run the contract tests to verify everything works:

```bash
npm test
```

## Troubleshooting

### Insufficient Balance

- **Hedera**: Get testnet HBAR from https://portal.hedera.com/
- **Base Sepolia**: Get testnet ETH from Base faucet

### Deployment Fails

1. Check your private keys are correct
2. Ensure you have sufficient balance
3. Verify network connectivity
4. Check that token addresses are correct

### Contract Verification Fails

- Wait a few minutes and try manual verification
- Ensure BASESCAN_API_KEY is set correctly
- Check constructor arguments match deployment

## Network Information

### Base Sepolia

- Chain ID: 84532
- RPC URL: https://sepolia.base.org
- Explorer: https://sepolia.basescan.org
- USDC Address: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

### Hedera Testnet

- Network: testnet
- Explorer: https://hashscan.io/testnet/
- USDh Address: `0x00000000000000000000000000000000006e24c7`

## Contract Architecture

```
AIR Token (ERC-20)
├── Base Sepolia: Platform token for liquidity pools
└── Hedera Testnet: Platform token for liquidity pools

Memecoin Factory
├── Creates new memecoins (1B supply)
├── Deploys bonding curve contracts
├── Uses USDC (Base) / USDh (Hedera)
└── Distributes fees (98% creator, 2% platform)

Liquidity Pool Factory
├── Creates MEMECOIN/AIR pools
├── Triggered at $69k market cap
└── Burns LP tokens for rug-pull protection
```

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review contract tests in `test/` directory
3. Check deployment logs for error messages
