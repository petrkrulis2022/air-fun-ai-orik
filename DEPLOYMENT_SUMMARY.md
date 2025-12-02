# Contract Deployment Summary - Task 17.4

## ✅ Deployment Complete!

All smart contracts have been successfully deployed to both Hedera testnet and Base Sepolia.

---

## Base Sepolia Testnet

### Network Information

- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org
- **Explorer**: https://sepolia.basescan.org
- **Stablecoin**: USDC - `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

### Deployed Contracts

| Contract                   | Address                                      | Explorer Link                                                                                       |
| -------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **AIR Token**              | `0xB2D4ED0c17487ABfEfC4d3feEE7EB860e82aA3f7` | [View on BaseScan](https://sepolia.basescan.org/address/0xB2D4ED0c17487ABfEfC4d3feEE7EB860e82aA3f7) |
| **Memecoin Factory**       | `0x3c4ceDfE7F0a20013B0adae70443d0102166Db54` | [View on BaseScan](https://sepolia.basescan.org/address/0x3c4ceDfE7F0a20013B0adae70443d0102166Db54) |
| **Liquidity Pool Factory** | `0x5834aEe88F9163a4146B3053D2Ffa34Bf53b6727` | [View on BaseScan](https://sepolia.basescan.org/address/0x5834aEe88F9163a4146B3053D2Ffa34Bf53b6727) |

---

## Hedera Testnet

### Network Information

- **Chain ID**: 296
- **RPC URL**: https://testnet.hashio.io/api
- **Explorer**: https://hashscan.io/testnet
- **Stablecoin**: USDh - `0x00000000000000000000000000000000006e24c7`

### Deployed Contracts

| Contract                   | Address                                      | Token ID      | Explorer Link                                                                                       |
| -------------------------- | -------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| **AIR Token**              | `0x00000000000000000000000000000000007052b7` | `0.0.7361207` | [View on HashScan](https://hashscan.io/testnet/token/0.0.7361207)                                   |
| **Memecoin Factory**       | `0x210542A52aF3c0A5854B75E84C67312Ffe6F004A` | -             | [View on HashScan](https://hashscan.io/testnet/contract/0x210542A52aF3c0A5854B75E84C67312Ffe6F004A) |
| **Liquidity Pool Factory** | `0x6796cb5394c66f194771b059c54137a9eD64cbEa` | -             | [View on HashScan](https://hashscan.io/testnet/contract/0x6796cb5394c66f194771b059c54137a9eD64cbEa) |

---

## Configuration Files Updated

### ✅ packages/contracts/.env

All deployed contract addresses have been added.

### ✅ packages/backend/.env.example

Template updated with deployed addresses for reference.

---

## Contract Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AIR Token (ERC-20)                      │
│  Base: 0xB2D4ED0c17487ABfEfC4d3feEE7EB860e82aA3f7         │
│  Hedera: 0.0.7361207                                        │
│  Purpose: Platform token for liquidity pools               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Memecoin Factory                         │
│  Base: 0x3c4ceDfE7F0a20013B0adae70443d0102166Db54         │
│  Hedera: 0x210542A52aF3c0A5854B75E84C67312Ffe6F004A       │
│  • Creates new memecoins (1B supply)                        │
│  • Deploys bonding curve contracts                          │
│  • Uses USDC (Base) / USDh (Hedera)                        │
│  • Distributes fees (98% creator, 2% platform)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               Liquidity Pool Factory                        │
│  Base: 0x5834aEe88F9163a4146B3053D2Ffa34Bf53b6727         │
│  Hedera: 0x6796cb5394c66f194771b059c54137a9eD64cbEa       │
│  • Creates MEMECOIN/AIR pools                               │
│  • Triggered at $69k market cap                             │
│  • Burns LP tokens for rug-pull protection                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Next Steps

### 1. Update Backend Configuration

Copy the deployed addresses to your backend `.env` file:

```bash
# Hedera
HEDERA_AIR_TOKEN_ADDRESS=0.0.7361207
HEDERA_MEMECOIN_FACTORY_ADDRESS=0x210542A52aF3c0A5854B75E84C67312Ffe6F004A
HEDERA_LIQUIDITY_POOL_FACTORY_ADDRESS=0x6796cb5394c66f194771b059c54137a9eD64cbEa
HEDERA_USDH_ADDRESS=0x00000000000000000000000000000000006e24c7

# Base Sepolia
BASE_AIR_TOKEN_ADDRESS=0xB2D4ED0c17487ABfEfC4d3feEE7EB860e82aA3f7
BASE_MEMECOIN_FACTORY_ADDRESS=0x3c4ceDfE7F0a20013B0adae70443d0102166Db54
BASE_LIQUIDITY_POOL_FACTORY_ADDRESS=0x5834aEe88F9163a4146B3053D2Ffa34Bf53b6727
BASE_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### 2. Test Contract Interactions

Run the contract tests to verify everything works:

```bash
cd packages/contracts
npm test
```

### 3. Deploy Backend Services

Continue with deploying the backend services to EC2 (next part of task 17.4).

### 4. Deploy Frontend Applications

Deploy the frontend applications to Vercel.

### 5. End-to-End Testing

Verify the complete flow:

- Create a stream
- Deploy a memecoin
- Execute purchases
- Test graduation to liquidity pool

---

## Deployment Notes

### Hedera Deployment Method

- Used JSON-RPC relay (testnet.hashio.io/api) instead of Hedera SDK for factory contracts
- This approach was more reliable for complex contract deployments
- AIR token was deployed using Hedera Token Service (HTS)

### Gas Usage

- Base Sepolia: ~0.001 ETH per contract
- Hedera: ~2 HBAR per contract

### Account Information

- **Deployer Address (EVM)**: `0x97B83759EADB2503a8947E8D6eb734795Cdefc95`
- **Hedera Account ID**: `0.0.7145005`
- **Remaining Balance**: ~741 HBAR

---

## Verification

All contracts can be verified on their respective block explorers using the links provided above.

**Deployment Date**: December 2, 2024
**Deployed By**: Task 17.4 - Deploy to testnet
