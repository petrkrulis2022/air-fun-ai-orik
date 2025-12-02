# Smart Contracts Quick Reference

Quick reference card for all deployed smart contracts.

---

## Base Sepolia (Chain ID: 84532)

### USDC (Stablecoin)

```
0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

🔗 https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e

### AIR Token

```
0xB2D4ED0c17487ABfEfC4d3feEE7EB860e82aA3f7
```

🔗 https://sepolia.basescan.org/address/0xB2D4ED0c17487ABfEfC4d3feEE7EB860e82aA3f7

### Memecoin Factory

```
0x3c4ceDfE7F0a20013B0adae70443d0102166Db54
```

🔗 https://sepolia.basescan.org/address/0x3c4ceDfE7F0a20013B0adae70443d0102166Db54

### Liquidity Pool Factory

```
0x5834aEe88F9163a4146B3053D2Ffa34Bf53b6727
```

🔗 https://sepolia.basescan.org/address/0x5834aEe88F9163a4146B3053D2Ffa34Bf53b6727

---

## Hedera Testnet (Chain ID: 296)

### USDh (Stablecoin)

```
Address: 0x00000000000000000000000000000000006e24c7
Token ID: 0.0.7200455
```

🔗 https://hashscan.io/testnet/token/0.0.7200455

### AIR Token

```
Address: 0x00000000000000000000000000000000007052b7
Token ID: 0.0.7361207
```

🔗 https://hashscan.io/testnet/token/0.0.7361207

### Memecoin Factory

```
0x210542A52aF3c0A5854B75E84C67312Ffe6F004A
```

🔗 https://hashscan.io/testnet/contract/0x210542A52aF3c0A5854B75E84C67312Ffe6F004A

### Liquidity Pool Factory

```
0x6796cb5394c66f194771b059c54137a9eD64cbEa
```

🔗 https://hashscan.io/testnet/contract/0x6796cb5394c66f194771b059c54137a9eD64cbEa

---

## Network Configuration

### Base Sepolia

```javascript
{
  networkName: "Base Sepolia",
  rpcUrl: "https://sepolia.base.org",
  chainId: 84532,
  symbol: "ETH",
  explorer: "https://sepolia.basescan.org"
}
```

### Hedera Testnet

```javascript
{
  networkName: "Hedera Testnet",
  rpcUrl: "https://testnet.hashio.io/api",
  chainId: 296,
  symbol: "HBAR",
  explorer: "https://hashscan.io/testnet"
}
```

---

## Environment Variables

### Backend (.env)

```bash
# Base Sepolia
BASE_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
BASE_AIR_TOKEN_ADDRESS=0xB2D4ED0c17487ABfEfC4d3feEE7EB860e82aA3f7
BASE_MEMECOIN_FACTORY_ADDRESS=0x3c4ceDfE7F0a20013B0adae70443d0102166Db54
BASE_LIQUIDITY_POOL_FACTORY_ADDRESS=0x5834aEe88F9163a4146B3053D2Ffa34Bf53b6727

# Hedera Testnet
HEDERA_USDH_ADDRESS=0x00000000000000000000000000000000006e24c7
HEDERA_AIR_TOKEN_ADDRESS=0.0.7361207
HEDERA_MEMECOIN_FACTORY_ADDRESS=0x210542A52aF3c0A5854B75E84C67312Ffe6F004A
HEDERA_LIQUIDITY_POOL_FACTORY_ADDRESS=0x6796cb5394c66f194771b059c54137a9eD64cbEa
```

---

## Contract Functions

### Memecoin Factory

```solidity
// Create new memecoin
createMemecoin(string name, string symbol, address creator)
  returns (address memecoinAddress, address bondingCurveAddress)

// Get creator's memecoins
getCreatorMemecoins(address creator)
  returns (MemecoinInfo[])
```

### Bonding Curve

```solidity
// Purchase tokens
purchase(uint256 tokenAmount, uint256 maxUsdcCost)

// Calculate purchase cost
calculatePurchaseCost(uint256 tokenAmount)
  returns (uint256 usdcCost)

// Get current price
getCurrentPrice()
  returns (uint256 pricePerToken)
```

### Liquidity Pool Factory

```solidity
// Create liquidity pool (called at graduation)
createPool(address memecoin, uint256 memecoinAmount, uint256 airAmount)
  returns (address poolAddress)
```

---

## Key Parameters

- **Bonding Curve K**: 0.000000001
- **Total Supply**: 1,000,000,000 tokens
- **Bonding Curve Supply**: 800,000,000 tokens (80%)
- **Graduation Threshold**: $69,000 market cap
- **Creator Fee**: 98%
- **Platform Fee**: 2%

---

**Last Updated**: December 2, 2024
