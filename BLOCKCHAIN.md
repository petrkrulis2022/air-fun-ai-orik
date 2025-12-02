# Blockchain Deployments

This document contains all deployed smart contract addresses for the air.fun platform on testnet environments.

---

## 🔗 Base Sepolia Testnet

### Network Information

- **Network Name**: Base Sepolia
- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org
- **Block Explorer**: https://sepolia.basescan.org
- **Native Token**: ETH
- **Stablecoin**: USDC

### Deployed Contracts

#### USDC Token (Stablecoin)

- **Address**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Explorer**: [View on BaseScan](https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
- **Type**: ERC-20 Stablecoin

#### AIR Platform Token

- **Address**: `0xB2D4ED0c17487ABfEfC4d3feEE7EB860e82aA3f7`
- **Explorer**: [View on BaseScan](https://sepolia.basescan.org/address/0xB2D4ED0c17487ABfEfC4d3feEE7EB860e82aA3f7)
- **Type**: ERC-20 Token
- **Symbol**: AIR
- **Decimals**: 18
- **Total Supply**: 1,000,000,000 AIR

#### Memecoin Factory

- **Address**: `0x3c4ceDfE7F0a20013B0adae70443d0102166Db54`
- **Explorer**: [View on BaseScan](https://sepolia.basescan.org/address/0x3c4ceDfE7F0a20013B0adae70443d0102166Db54)
- **Type**: Factory Contract
- **Purpose**: Creates new memecoins with bonding curves
- **Stablecoin Used**: USDC
- **Fee Structure**: 98% creator, 2% platform

#### Liquidity Pool Factory

- **Address**: `0x5834aEe88F9163a4146B3053D2Ffa34Bf53b6727`
- **Explorer**: [View on BaseScan](https://sepolia.basescan.org/address/0x5834aEe88F9163a4146B3053D2Ffa34Bf53b6727)
- **Type**: Factory Contract
- **Purpose**: Creates MEMECOIN/AIR liquidity pools
- **Graduation Threshold**: $69,000 market cap
- **LP Token**: Burned for rug-pull protection

---

## 🔗 Hedera Testnet

### Network Information

- **Network Name**: Hedera Testnet
- **Chain ID**: 296
- **RPC URL**: https://testnet.hashio.io/api
- **Block Explorer**: https://hashscan.io/testnet
- **Native Token**: HBAR
- **Stablecoin**: USDh (Custom)

### Deployed Contracts

#### USDh Token (Stablecoin)

- **Address**: `0x00000000000000000000000000000000006e24c7`
- **Token ID**: `0.0.7200455`
- **Explorer**: [View on HashScan](https://hashscan.io/testnet/token/0.0.7200455)
- **Type**: HTS Token (Hedera Token Service)
- **Symbol**: USDh

#### AIR Platform Token

- **Address (EVM)**: `0x00000000000000000000000000000000007052b7`
- **Token ID**: `0.0.7361207`
- **Explorer**: [View on HashScan](https://hashscan.io/testnet/token/0.0.7361207)
- **Type**: HTS Token (Hedera Token Service)
- **Symbol**: AIR
- **Decimals**: 8
- **Total Supply**: 1,000,000,000 AIR

#### Memecoin Factory

- **Address**: `0x210542A52aF3c0A5854B75E84C67312Ffe6F004A`
- **Explorer**: [View on HashScan](https://hashscan.io/testnet/contract/0x210542A52aF3c0A5854B75E84C67312Ffe6F004A)
- **Type**: Smart Contract
- **Purpose**: Creates new memecoins with bonding curves
- **Stablecoin Used**: USDh
- **Fee Structure**: 98% creator, 2% platform

#### Liquidity Pool Factory

- **Address**: `0x6796cb5394c66f194771b059c54137a9eD64cbEa`
- **Explorer**: [View on HashScan](https://hashscan.io/testnet/contract/0x6796cb5394c66f194771b059c54137a9eD64cbEa)
- **Type**: Smart Contract
- **Purpose**: Creates MEMECOIN/AIR liquidity pools
- **Graduation Threshold**: $69,000 market cap
- **LP Token**: Burned for rug-pull protection

---

## 📊 Contract Interactions

### Creating a Memecoin

**Base Sepolia:**

```javascript
// Contract: 0x3c4ceDfE7F0a20013B0adae70443d0102166Db54
// Function: createMemecoin(name, symbol, creator)
// Stablecoin: USDC (0x036CbD53842c5426634e7929541eC2318f3dCF7e)
```

**Hedera Testnet:**

```javascript
// Contract: 0x210542A52aF3c0A5854B75E84C67312Ffe6F004A
// Function: createMemecoin(name, symbol, creator)
// Stablecoin: USDh (0x00000000000000000000000000000000006e24c7)
```

### Purchasing Tokens

Both chains use the same bonding curve formula:

- **Formula**: `price = k * sold²`
- **K Value**: 0.000000001
- **Supply**: 800,000,000 tokens (80% of total supply)

### Graduation to Liquidity Pool

When a memecoin reaches $69,000 market cap:

1. Liquidity pool is created with MEMECOIN/AIR pair
2. LP tokens are burned
3. Token becomes tradeable on DEX

---

## 🔐 Security

### Verified Contracts

**Base Sepolia:**

- All contracts can be verified on BaseScan
- Source code available for audit

**Hedera Testnet:**

- Contracts deployed via JSON-RPC relay
- Viewable on HashScan

### Audit Status

- ⚠️ **Testnet Deployment** - Not audited for production use
- For production deployment, contracts should undergo professional security audit

---

## 🛠️ Developer Resources

### Adding Networks to MetaMask

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

### Contract ABIs

Contract ABIs are available in:

- `packages/contracts/artifacts/contracts/`
- `packages/backend/src/contracts/abis.ts`

### Testing

Get testnet tokens:

- **Base Sepolia ETH**: [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
- **Hedera HBAR**: [Hedera Portal](https://portal.hedera.com/)

---

## 📝 Deployment Information

- **Deployment Date**: December 2, 2024
- **Deployer Account (Hedera)**: `0.0.7145005`
- **Deployer Address (EVM)**: `0x97B83759EADB2503a8947E8D6eb734795Cdefc95`
- **Deployment Method**:
  - Base Sepolia: Hardhat + ethers.js
  - Hedera: JSON-RPC relay (testnet.hashio.io/api)

---

## 🔄 Contract Upgrade Path

Current contracts are **not upgradeable**. For production:

- Consider implementing proxy pattern (UUPS or Transparent)
- Add timelock for critical operations
- Implement multi-sig for admin functions

---

## 📞 Support

For issues or questions about the deployed contracts:

1. Check transaction on block explorer
2. Review contract source code
3. Test on testnet before mainnet deployment

---

## ⚠️ Important Notes

1. **Testnet Only**: These contracts are deployed on testnets for development and testing
2. **No Real Value**: Tokens on testnet have no real-world value
3. **May Reset**: Testnet contracts may be redeployed as needed
4. **Not Audited**: These contracts have not undergone professional security audit
5. **Use at Own Risk**: For testing and development purposes only

---

Last Updated: December 2, 2024
