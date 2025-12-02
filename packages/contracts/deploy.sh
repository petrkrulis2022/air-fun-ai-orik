#!/bin/bash

# Contract Deployment Script
# This script deploys all contracts to Hedera testnet and Base Sepolia

set -e  # Exit on error

echo "=========================================="
echo "Contract Deployment Script"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file with your credentials"
    exit 1
fi

# Load environment variables
source .env

# Verify required variables
if [ -z "$HEDERA_ACCOUNT_ID" ] || [ -z "$HEDERA_PRIVATE_KEY" ]; then
    echo "❌ Error: Hedera credentials not set in .env"
    exit 1
fi

if [ -z "$BASE_SEPOLIA_PRIVATE_KEY" ]; then
    echo "❌ Error: Base Sepolia private key not set in .env"
    exit 1
fi

echo "Configuration:"
echo "- Hedera Account: $HEDERA_ACCOUNT_ID"
echo "- Base USDC: ${BASE_USDC_ADDRESS:-0x036CbD53842c5426634e7929541eC2318f3dCF7e}"
echo "- Hedera USDh: ${HEDERA_USDH_ADDRESS:-0x00000000000000000000000000000000006e24c7}"
echo ""

# Compile contracts
echo "=========================================="
echo "Step 1: Compiling contracts..."
echo "=========================================="
npm run compile
echo "✅ Compilation complete"
echo ""

# Deploy to Base Sepolia
echo "=========================================="
echo "Step 2: Deploying to Base Sepolia..."
echo "=========================================="

echo "Deploying AIR Token to Base Sepolia..."
npm run deploy:air:base
echo ""

echo "Deploying Memecoin Factory to Base Sepolia..."
npm run deploy:factory:base
echo ""

echo "Deploying Liquidity Pool Factory to Base Sepolia..."
npm run deploy:pool-factory:base
echo ""

echo "✅ Base Sepolia deployment complete"
echo ""

# Deploy to Hedera Testnet
echo "=========================================="
echo "Step 3: Deploying to Hedera Testnet..."
echo "=========================================="

echo "Deploying AIR Token to Hedera Testnet..."
npm run deploy:air:hedera
echo ""

echo "Deploying Memecoin Factory to Hedera Testnet..."
npm run deploy:factory:hedera
echo ""

echo "Deploying Liquidity Pool Factory to Hedera Testnet..."
npm run deploy:pool-factory:hedera
echo ""

echo "✅ Hedera Testnet deployment complete"
echo ""

# Summary
echo "=========================================="
echo "🎉 All Deployments Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Copy the deployed contract addresses from the output above"
echo "2. Update packages/contracts/.env with the addresses"
echo "3. Update packages/backend/.env with the addresses"
echo "4. Verify contracts on block explorers"
echo ""
echo "Base Sepolia Explorer: https://sepolia.basescan.org/"
echo "Hedera Testnet Explorer: https://hashscan.io/testnet/"
echo ""
