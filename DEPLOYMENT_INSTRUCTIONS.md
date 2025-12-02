# Deployment Instructions for Task 17.4

## Summary

All deployment scripts have been prepared and configured with the correct token addresses:

- **Base Sepolia USDC**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Hedera Testnet USDh**: `0x00000000000000000000000000000000006e24c7`

## Quick Start

### 1. Configure Environment

Edit `packages/contracts/.env` and add your credentials:

```env
# Hedera Testnet
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_PRIVATE_KEY=your_hedera_private_key

# Base Sepolia
BASE_SEPOLIA_PRIVATE_KEY=your_base_sepolia_private_key
BASESCAN_API_KEY=your_basescan_api_key  # Optional

# Platform Wallet (optional, defaults to deployer)
PLATFORM_WALLET_ADDRESS=
```

### 2. Deploy All Contracts

```bash
cd packages/contracts
npm run compile
npm run deploy:all
```

This will deploy:

1. ✅ AIR Token → Base Sepolia
2. ✅ AIR Token → Hedera Testnet
3. ✅ Memecoin Factory → Base Sepolia (using USDC)
4. ✅ Memecoin Factory → Hedera Testnet (using USDh)
5. ✅ Liquidity Pool Factory → Base Sepolia
6. ✅ Liquidity Pool Factory → Hedera Testnet

### 3. Update Configuration

After deployment, copy the contract addresses from the output and update:

**packages/backend/.env:**

```env
HEDERA_AIR_TOKEN_ADDRESS=<from_deployment>
HEDERA_MEMECOIN_FACTORY_ADDRESS=<from_deployment>
HEDERA_LIQUIDITY_POOL_FACTORY_ADDRESS=<from_deployment>
HEDERA_USDH_ADDRESS=0x00000000000000000000000000000000006e24c7

BASE_AIR_TOKEN_ADDRESS=<from_deployment>
BASE_MEMECOIN_FACTORY_ADDRESS=<from_deployment>
BASE_LIQUIDITY_POOL_FACTORY_ADDRESS=<from_deployment>
BASE_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

## Alternative: Deploy Individually

If you prefer to deploy step-by-step:

```bash
cd packages/contracts

# Step 1: Deploy AIR tokens
npm run deploy:air:base
npm run deploy:air:hedera

# Step 2: Update .env with AIR token addresses, then deploy factories
npm run deploy:factory:base
npm run deploy:factory:hedera

# Step 3: Deploy pool factories
npm run deploy:pool-factory:base
npm run deploy:pool-factory:hedera
```

## Verification

### Base Sepolia

- View contracts on BaseScan: https://sepolia.basescan.org/
- Contracts auto-verify if BASESCAN_API_KEY is set

### Hedera Testnet

- View contracts on HashScan: https://hashscan.io/testnet/

## Need Help?

See detailed guide: `packages/contracts/DEPLOYMENT_GUIDE.md`
