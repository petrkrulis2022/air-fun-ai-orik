# Smart Contracts Quick Reference

Quick reference card for all deployed smart contracts.

> 📚 **For complete integration guide, see [BLOCKCHAIN_INTEGRATION.md](./BLOCKCHAIN_INTEGRATION.md)**

---

## �� Base Sepolia (Chain ID: 84532)

### Contracts at a Glance

| Contract | Address |
|----------|---------|
| USDC | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| AIR Token | `0xB2D4ED0c17487ABfEfC4d3feEE7EB860e82aA3f7` |
| Memecoin Factory | `0x3c4ceDfE7F0a20013B0adae70443d0102166Db54` |
| Liquidity Pool Factory | `0x5834aEe88F9163a4146B3053D2Ffa34Bf53b6727` |

### Explorer Links

- USDC: https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e
- AIR: https://sepolia.basescan.org/address/0xB2D4ED0c17487ABfEfC4d3feEE7EB860e82aA3f7
- Factory: https://sepolia.basescan.org/address/0x3c4ceDfE7F0a20013B0adae70443d0102166Db54
- Pool Factory: https://sepolia.basescan.org/address/0x5834aEe88F9163a4146B3053D2Ffa34Bf53b6727

---

## ⬡ Hedera Testnet (Chain ID: 296)

### Contracts at a Glance

| Contract | Address | Token ID |
|----------|---------|----------|
| USDh | `0x00000000000000000000000000000000006e24c7` | `0.0.7200455` |
| AIR Token | `0x00000000000000000000000000000000007052b7` | `0.0.7361207` |
| Memecoin Factory | `0x210542A52aF3c0A5854B75E84C67312Ffe6F004A` | - |
| Liquidity Pool Factory | `0x6796cb5394c66f194771b059c54137a9eD64cbEa` | - |

### Explorer Links

- USDh: https://hashscan.io/testnet/token/0.0.7200455
- AIR: https://hashscan.io/testnet/token/0.0.7361207
- Factory: https://hashscan.io/testnet/contract/0x210542A52aF3c0A5854B75E84C67312Ffe6F004A
- Pool Factory: https://hashscan.io/testnet/contract/0x6796cb5394c66f194771b059c54137a9eD64cbEa

---

## 🔗 Network Configuration

```javascript
// Base Sepolia
{
  networkName: "Base Sepolia",
  rpcUrl: "https://sepolia.base.org",
  chainId: 84532,
  symbol: "ETH",
  explorer: "https://sepolia.basescan.org"
}

// Hedera Testnet
{
  networkName: "Hedera Testnet",
  rpcUrl: "https://testnet.hashio.io/api",
  chainId: 296,
  symbol: "HBAR",
  explorer: "https://hashscan.io/testnet"
}
```

---

## 🌐 Environment Variables

```bash
# Base Sepolia
BASE_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
BASE_AIR_TOKEN_ADDRESS=0xB2D4ED0c17487ABfEfC4d3feEE7EB860e82aA3f7
BASE_MEMECOIN_FACTORY_ADDRESS=0x3c4ceDfE7F0a20013B0adae70443d0102166Db54
BASE_LIQUIDITY_POOL_FACTORY_ADDRESS=0x5834aEe88F9163a4146B3053D2Ffa34Bf53b6727

# Hedera Testnet
HEDERA_USDH_ADDRESS=0x00000000000000000000000000000000006e24c7
HEDERA_AIR_TOKEN_ADDRESS=0x00000000000000000000000000000000007052b7
HEDERA_MEMECOIN_FACTORY_ADDRESS=0x210542A52aF3c0A5854B75E84C67312Ffe6F004A
HEDERA_LIQUIDITY_POOL_FACTORY_ADDRESS=0x6796cb5394c66f194771b059c54137a9eD64cbEa
```

---

## ⚡ Key Contract Functions

### Memecoin Factory

```solidity
// Deploy new memecoin + bonding curve
createMemecoin(string name, string symbol, address creator)
  returns (address memecoinAddress, address bondingCurveAddress)

// Query creator's memecoins
getCreatorMemecoins(address creator)
  returns (MemecoinInfo[])
```

### Bonding Curve

```solidity
// Purchase tokens with stablecoin
purchase(uint256 tokenAmount, uint256 maxUsdcCost)

// Sell tokens back
sell(uint256 tokenAmount, uint256 minUsdcReceived)

// Price queries
calculatePurchaseCost(uint256 tokenAmount) returns (uint256)
getCurrentPrice() returns (uint256)
```

### Liquidity Pool Factory

```solidity
// Create DEX pool at graduation ($69K market cap)
createPool(address memecoin, uint256 memecoinAmount, uint256 airAmount)
  returns (address poolAddress)
```

---

## 📊 Key Parameters

| Parameter | Value |
|-----------|-------|
| Total Supply | 1,000,000,000 |
| Creator Allocation | 200,000,000 (20%) |
| Bonding Curve Supply | 800,000,000 (80%) |
| Bonding Curve K | 0.000000001 |
| Graduation Threshold | $69,000 |
| Creator Fee | 98% |
| Platform Fee | 2% |

---

## 🖥️ Frontend Deployment Modal

The streamer sees real-time deployment progress via WebSocket:

```
┌─────────────────────────────────────────┐
│ 🔵 Deploying Your Token                 │
│ Base Sepolia • Chain ID: 84532          │
├─────────────────────────────────────────┤
│ ✅ Generating Token Symbol              │
│ ✅ Connecting to Factory Contract       │
│ ✅ Sending Transaction                  │
│    TX: 0xa1b2...3c4d → View on BaseScan │
│ ⏳ Confirming Transaction               │
│ ○  Memecoin Contract Deployed           │
│ ○  Bonding Curve Deployed               │
│ ○  Creator Tokens Allocated             │
│ ○  Deployment Complete                  │
├─────────────────────────────────────────┤
│                          ⏳ Elapsed: 12s │
└─────────────────────────────────────────┘
```

### WebSocket Event

```typescript
// Subscribe to deployment updates
socket.on("deployment_status", (data) => {
  // data.step: "sending_transaction", "memecoin_deployed", etc.
  // data.status: "in-progress", "completed", "error"
  // data.txHash: "0x..." (when available)
  // data.address: "0x..." (deployed contract)
});
```

---

## 🔗 Quick Explorer Links

### Generate URLs programmatically:

```typescript
// Base Sepolia
const baseExplorer = (type: 'tx' | 'address', value: string) =>
  `https://sepolia.basescan.org/${type}/${value}`;

// Hedera Testnet
const hederaExplorer = (type: 'tx' | 'address', value: string) =>
  `https://hashscan.io/testnet/${type === 'tx' ? 'transaction' : 'account'}/${value}`;
```

---

## 📚 Related Documentation

- **Full Integration Guide**: [BLOCKCHAIN_INTEGRATION.md](./BLOCKCHAIN_INTEGRATION.md)
- **Contract Deployment Guide**: [packages/contracts/DEPLOYMENT_GUIDE.md](./packages/contracts/DEPLOYMENT_GUIDE.md)
- **Factory README**: [packages/contracts/FACTORY_README.md](./packages/contracts/FACTORY_README.md)

---

**Last Updated**: December 6, 2024
