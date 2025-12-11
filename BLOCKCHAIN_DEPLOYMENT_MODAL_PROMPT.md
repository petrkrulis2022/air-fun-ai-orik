# Blockchain Deployment Modal - Implementation Prompt

**For the other Air.Fun codebase (Platform/Filter mode)**

---

## 🎯 Objective

Create a real-time blockchain deployment status modal that shows streamers exactly what's happening when their memecoin is being deployed to the blockchain. This modal provides transparency, builds trust, and educates users about the blockchain deployment process.

---

## 📍 Reference Implementation

**File Location in air-fun-ai-orik codebase:**

```
packages/frontend-streamer/src/components/BlockchainDeploymentModal.tsx
```

This is a **470-line React component** that handles the complete deployment visualization experience.

---

## 🏗️ What This Modal Does

### When It Appears

- **Trigger**: Automatically appears when a streamer starts a new stream
- **Process**: Backend initiates blockchain token deployment
- **Duration**: Typically 30-60 seconds for full deployment

### What It Shows

The modal displays **real-time deployment progress** across multiple steps:

1. ✅ **Generating Token Symbol** (e.g., "MYCOIN")
2. ⏳ **Connecting to Factory Contract**
3. 🔄 **Sending Transaction** (with TX hash)
4. ⏳ **Confirming Transaction** (with block number)
5. ✅ **Memecoin Contract Deployed** (with contract address)
6. ✅ **Bonding Curve Deployed** (with contract address)
7. ✅ **Creator Tokens Allocated** (200M tokens = 20% of supply)
8. ✅ **Deployment Complete!**

---

## 🎨 Visual Design Features

### Modal Layout

```
┌─────────────────────────────────────────────────────────┐
│ 🔵 Deploying Your Token                                 │
│ Base Sepolia • Chain ID: 84532                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Token Name: My Awesome Stream                           │
│ Symbol: $MYAWE                                          │
│                                                         │
│ ┌─ Step 1: Generating Token Symbol ────────────── ✅   │
│ │                                                       │
│ └───────────────────────────────────────────────────── │
│                                                         │
│ ┌─ Step 2: Connecting to Factory Contract ─────── ✅   │
│ │                                                       │
│ └───────────────────────────────────────────────────── │
│                                                         │
│ ┌─ Step 3: Sending Transaction ────────────────── ⏳   │
│ │ TX: 0x1234...5678                                     │
│ │ 📋 Copy  🔗 View on BaseScan                          │
│ └───────────────────────────────────────────────────── │
│                                                         │
│ ... more steps ...                                      │
│                                                         │
│ ✅ Deployment Complete!                                 │
│                                                         │
│ 🪙 View Token on BaseScan                               │
│ 📈 View Pool on BaseScan                                │
│                                                         │
│ Token Contract: 0xABC...DEF 📋                          │
│ Bonding Curve: 0x123...456 📋                           │
│ Your Allocation: 🎉 200,000,000 tokens (20%)            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Elapsed: 45s              [Continue to Stream] →        │
└─────────────────────────────────────────────────────────┘
```

### Status Icons

- ✅ **Green checkmark** - Completed step
- ⏳ **Hourglass with spin animation** - In-progress step
- ❌ **Red X** - Error step
- ⏸️ **Gray number** - Pending step

### Color Coding

- **Green** (`bg-green-500/10`, `border-green-500/50`) - Completed
- **Purple** (`bg-purple-500/10`, `border-purple-500/50`) - In-progress
- **Red** (`bg-red-500/10`, `border-red-500/50`) - Error
- **Gray** (`bg-gray-800/50`, `border-gray-700`) - Pending

---

## 🔗 Blockchain Integration

### Dual-Chain Support

The modal must support **both Base Sepolia and Hedera Testnet**:

#### Base Sepolia (Chain ID: 84532)

```typescript
Chain: "base"
Explorer: https://sepolia.basescan.org
Icon: 🔵

Deployed Contracts:
- USDC:                  0x036CbD53842c5426634e7929541eC2318f3dCF7e
- AIR Token:             0xB2D4ED0c17487ABfEfC4d3feEE7EB860e82aA3f7
- Memecoin Factory:      0x3c4ceDfE7F0a20013B0adae70443d0102166Db54
- Liquidity Pool Factory: 0x5834aEe88F9163a4146B3053D2Ffa34Bf53b6727
```

#### Hedera Testnet (Chain ID: 296)

```typescript
Chain: "hedera"
Explorer: https://hashscan.io/testnet
Icon: ⬡

Deployed Contracts:
- USDh:                  0x00000000000000000000000000000000006e24c7 (Token ID: 0.0.7200455)
- AIR Token:             0x00000000000000000000000000000000007052b7 (Token ID: 0.0.7361207)
- Memecoin Factory:      0x210542A52aF3c0A5854B75E84C67312Ffe6F004A
- Liquidity Pool Factory: 0x6796cb5394c66f194771b059c54137a9eD64cbEa
- Platform Wallet:       0x97b83759eadb2503a8947e8d6eb734795cdefc95
```

### Explorer Links

The modal generates clickable links to blockchain explorers:

```typescript
function getExplorerUrl(chain: "base" | "hedera", type: "tx" | "address", value: string) {
  if (chain === "base") {
    return `https://sepolia.basescan.org/${type === "tx" ? "tx" : "address"}/${value}`;
  } else {
    return `https://hashscan.io/testnet/${type === "tx" ? "transaction" : "account"}/${value}`;
  }
}
```

---

## 📊 Data Structure

### DeploymentStep Interface

```typescript
export interface DeploymentStep {
  id: string; // Unique step identifier
  label: string; // Display label (e.g., "Generating Token Symbol")
  status: "pending" | "in-progress" | "completed" | "error";
  details?: string; // Additional info (e.g., "Waiting for confirmation...")
  txHash?: string; // Transaction hash (0x...)
  address?: string; // Contract address (0x...)
  blockNumber?: number; // Block number
  timestamp?: number; // Unix timestamp
}
```

### DeploymentInfo Interface

```typescript
export interface DeploymentInfo {
  streamId: string; // Unique stream identifier
  tokenName: string; // Full token name (e.g., "My Awesome Stream")
  tokenSymbol: string; // Token symbol (e.g., "MYAWE")
  chain: "base" | "hedera"; // Which blockchain
  chainId: number; // 84532 (Base) or 296 (Hedera)

  // Contract Addresses (populated as deployment progresses)
  factoryAddress?: string; // MemecoinFactory contract
  memecoinAddress?: string; // Deployed memecoin contract
  bondingCurveAddress?: string; // Bonding curve contract
  creatorAddress?: string; // Streamer's wallet address
  creatorTokens?: string; // "200,000,000" (creator allocation)

  // Deployment Steps (array of steps)
  steps: DeploymentStep[];
}
```

---

## 🔄 Real-Time Updates

### Backend Communication

The modal receives real-time updates from the backend via **WebSocket** or **Server-Sent Events (SSE)**:

```typescript
// Example WebSocket message format
{
  type: "DEPLOYMENT_UPDATE",
  streamId: "stream_123",
  step: {
    id: "sending_tx",
    label: "Sending Transaction",
    status: "in-progress",
    details: "Waiting for blockchain confirmation...",
    txHash: "0x1234567890abcdef..."
  }
}

// When step completes
{
  type: "DEPLOYMENT_UPDATE",
  streamId: "stream_123",
  step: {
    id: "sending_tx",
    label: "Sending Transaction",
    status: "completed",
    txHash: "0x1234567890abcdef...",
    blockNumber: 12345678,
    timestamp: 1702310400
  }
}
```

### Update Flow

```
Backend                         Frontend Modal
  │                                   │
  │  1. Stream Start Request          │
  │<──────────────────────────────────│
  │                                   │
  │  2. Generate Token Symbol         │
  ├─► Update: "generating_symbol"    │
  │   status: "in-progress"           │
  │───────────────────────────────────>│ Shows spinning icon
  │                                   │
  │  3. Symbol Generated: "MYAWE"     │
  ├─► Update: "generating_symbol"    │
  │   status: "completed"             │
  │───────────────────────────────────>│ Shows green checkmark
  │                                   │
  │  4. Call Factory Contract         │
  ├─► Update: "connecting_factory"   │
  │   status: "in-progress"           │
  │───────────────────────────────────>│ Shows spinning icon
  │                                   │
  │  5. Send Transaction              │
  ├─► Update: "sending_tx"           │
  │   status: "in-progress"           │
  │   txHash: "0x1234..."             │
  │───────────────────────────────────>│ Shows TX link
  │                                   │
  │  6. Transaction Confirmed         │
  ├─► Update: "sending_tx"           │
  │   status: "completed"             │
  │   blockNumber: 12345678           │
  │───────────────────────────────────>│ Shows block number
  │                                   │
  │  ... continues for all steps ...  │
  │                                   │
  │  7. Deployment Complete           │
  ├─► Update: "deployment_complete"  │
  │   status: "completed"             │
  │   memecoinAddress: "0xABC..."     │
  │   bondingCurveAddress: "0x123..." │
  │   creatorTokens: "200,000,000"    │
  │───────────────────────────────────>│ Shows success screen
  │                                   │
```

---

## 🎯 What Streamer Should See

### Initial State (0-5 seconds)

```
⛓️ Deploying Your Token
Base Sepolia • Chain ID: 84532

Token Name: My Awesome Stream
Symbol: $MYAWE

⏳ Generating Token Symbol...
⏸️ Connecting to Factory Contract
⏸️ Sending Transaction
⏸️ Confirming Transaction
⏸️ Memecoin Contract Deployed
⏸️ Bonding Curve Deployed
⏸️ Creator Tokens Allocated
⏸️ Deployment Complete

Elapsed: 2s
```

### Mid-Deployment (15-30 seconds)

```
⛓️ Deploying Your Token
Base Sepolia • Chain ID: 84532

Token Name: My Awesome Stream
Symbol: $MYAWE

✅ Generating Token Symbol
    Generated: MYAWE

✅ Connecting to Factory Contract
    Factory: 0x3c4c...Db54

⏳ Sending Transaction
    TX: 0x1234...5678 📋 🔗 View on BaseScan
    Waiting for confirmation...

⏸️ Confirming Transaction
⏸️ Memecoin Contract Deployed
⏸️ Bonding Curve Deployed
⏸️ Creator Tokens Allocated
⏸️ Deployment Complete

Elapsed: 22s
```

### Completed State (45-60 seconds)

```
⛓️ Deploying Your Token
Base Sepolia • Chain ID: 84532

Token Name: My Awesome Stream
Symbol: $MYAWE

✅ Generating Token Symbol
✅ Connecting to Factory Contract
✅ Sending Transaction
    TX: 0x1234...5678 📋 🔗 BaseScan
    Block: #12345678
✅ Confirming Transaction
✅ Memecoin Contract Deployed
    Address: 0xABCD...EF12 📋 🔗 BaseScan
✅ Bonding Curve Deployed
    Address: 0x1234...5678 📋 🔗 BaseScan
✅ Creator Tokens Allocated
    Amount: 200,000,000 tokens
✅ Deployment Complete!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Deployment Complete!

🪙 View Token on BaseScan →
📈 View Pool on BaseScan →

Token Contract: 0xABCD...EF12 📋
Bonding Curve: 0x1234...5678 📋
Your Allocation: 🎉 200,000,000 tokens (20%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Deployment successful!        [Continue to Stream] →

Elapsed: 47s
```

---

## 🛠️ Smart Contracts Being Deployed

### Step-by-Step Breakdown

#### 1. MemecoinFactory.createMemecoin()

**Contract:** `MemecoinFactory` (0x3c4c...Db54 on Base, 0x2105...004A on Hedera)

**What it does:**

- Deploys **TWO** contracts in a single transaction:
  1. **Memecoin** (ERC-20 token) - 1 billion total supply
  2. **BondingCurve** - Handles token sales via bonding curve pricing

**Gas paid by:** Platform (streamer pays nothing!)

**Function signature:**

```solidity
function createMemecoin(
    string memory name,        // "My Awesome Stream"
    string memory symbol,      // "MYAWE"
    address creator           // Streamer's wallet address
) external returns (
    address memecoinAddress,
    address bondingCurveAddress
);
```

#### 2. Memecoin Contract (ERC-20)

**What it deploys:**

- Standard ERC-20 token with 1,000,000,000 supply
- **Automatic distribution on deployment:**
  - 200,000,000 (20%) → Streamer's wallet (creator allocation)
  - 800,000,000 (80%) → BondingCurve contract (for sale)

**Key functions:**

```solidity
function balanceOf(address account) external view returns (uint256);
function transfer(address to, uint256 amount) external returns (bool);
function approve(address spender, uint256 amount) external returns (bool);
```

#### 3. BondingCurve Contract

**What it deploys:**

- Holds 800M tokens for sale
- Implements quadratic pricing: `price = k * sold²`
- Automatically distributes fees:
  - 98% → Streamer's wallet (creator fee)
  - 2% → Platform wallet

**Key functions:**

```solidity
function purchase(uint256 tokenAmount, uint256 maxCost) external;
function calculatePrice() external view returns (uint256);
function getTokensSold() external view returns (uint256);
```

#### 4. LiquidityPoolFactory (Future - Post-Graduation)

**Contract:** `LiquidityPoolFactory` (0x5834...6727 on Base, 0x6796...cbEa on Hedera)

**Used when:** Token reaches $69K market cap

**What it does:**

- Creates MEMECOIN/AIR liquidity pool
- Burns LP tokens (rug-pull protection)
- Token becomes tradeable on DEX

---

## 🔐 What Contracts Streamer Interacts With

### During Stream Creation (Automatic)

**Streamer does:** Fills form (title, thumbnail)
**Backend does:** Calls `MemecoinFactory.createMemecoin()`
**Streamer pays:** $0 (platform pays gas)

**Result:**

- ✅ Memecoin deployed
- ✅ BondingCurve deployed
- ✅ 200M tokens in streamer's wallet

### When Viewer Buys Tokens

**Viewer does:**

1. Approves USDC/USDh spending
2. Calls `BondingCurve.purchase()`

**Streamer receives:** 98% of payment (instant, on-chain)

**Streamer action required:** None! It's automatic.

### Post-Graduation (Future)

**Platform does:** Calls `LiquidityPoolFactory.createLiquidityPool()`
**Streamer receives:** Token is now on DEX (tradeable against AIR)

---

## 💡 Key Features to Implement

### 1. Copy to Clipboard Buttons

Every address and TX hash should have a **📋 Copy** button:

```typescript
<button
  onClick={() => navigator.clipboard.writeText(txHash)}
  className="text-gray-400 hover:text-white"
  title="Copy transaction hash"
>
  📋
</button>
```

### 2. Explorer Links

Every TX/address should link to blockchain explorer:

```typescript
<a
  href={getExplorerUrl(chain, "tx", txHash)}
  target="_blank"
  rel="noopener noreferrer"
  className="text-blue-400 hover:text-blue-300"
>
  View on {chain === "base" ? "BaseScan" : "HashScan"} 🔗
</a>
```

### 3. Elapsed Time Counter

Show deployment duration:

```typescript
const [elapsedTime, setElapsedTime] = useState(0);
const [startTime] = useState(Date.now());

useEffect(() => {
  const interval = setInterval(() => {
    setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
  }, 1000);
  return () => clearInterval(interval);
}, [startTime]);

// Display: Elapsed: {elapsedTime}s
```

### 4. Background Continuation

Allow streamer to **minimize modal** and continue in background:

```typescript
<button onClick={onClose} className="text-sm text-gray-400">
  Continue in background
</button>
```

### 5. Reopen Deployment Status

Add button to reopen modal after closing:

```typescript
{deploymentInfo && !showDeploymentModal && (
  <button
    onClick={() => setShowDeploymentModal(true)}
    className="fixed bottom-4 right-4 bg-purple-600 px-4 py-2 rounded-lg"
  >
    📊 View Deployment Status
  </button>
)}
```

### 6. Error Handling

Show clear error messages if deployment fails:

```typescript
{hasError && (
  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
    <h3 className="text-red-400 font-semibold">❌ Deployment Error</h3>
    <p className="text-gray-300 text-sm">
      There was an error deploying your token. Please try again or contact support.
    </p>
  </div>
)}
```

---

## 🎨 Styling Guidelines

### Color Palette

```css
/* Background */
bg-gray-900          /* Modal background */
bg-gray-800          /* Card background */
bg-gray-700          /* Border color */

/* Gradients */
from-purple-600 to-pink-600  /* Header gradient */
from-green-500/20 to-emerald-500/20  /* Success background */

/* Status Colors */
text-green-400       /* Completed steps */
text-purple-400      /* In-progress steps */
text-red-400         /* Error steps */
text-gray-400        /* Pending steps */

/* Buttons */
bg-purple-600 hover:bg-purple-700  /* Primary button */
bg-pink-600 hover:bg-pink-700      /* Secondary button */
```

### Animations

```css
/* Spinning loader */
.animate-spin        /* Rotating icon */
.animate-pulse       /* Pulsing effect */

/* Transitions */
transition-all       /* Smooth state changes */
transition-colors    /* Button hover effects */
```

### Responsive Design

```typescript
// Mobile-friendly modal
className = "fixed inset-0 flex items-center justify-center p-4";

// Scrollable content
className = "max-h-[90vh] overflow-hidden";
className = "overflow-y-auto max-h-[60vh]";

// Flexible layout
className = "max-w-2xl w-full"; // Desktop
className = "max-w-md w-full"; // Mobile (loading state)
```

---

## 🧪 Testing Checklist

### Functional Tests

- [ ] Modal opens on stream creation
- [ ] Real-time step updates work
- [ ] TX hashes are clickable and link to explorer
- [ ] Addresses are clickable and link to explorer
- [ ] Copy buttons work for all addresses/TXs
- [ ] Elapsed timer counts correctly
- [ ] Modal can be minimized to background
- [ ] Modal can be reopened after minimizing
- [ ] Success state shows all deployed contracts
- [ ] Error state displays correctly

### Visual Tests

- [ ] Status icons animate correctly (spin, pulse)
- [ ] Colors match status (green=done, purple=progress, red=error)
- [ ] Mobile responsive (looks good on small screens)
- [ ] Scrolling works when many steps
- [ ] Buttons have hover states
- [ ] Links have visited states

### Chain-Specific Tests

- [ ] Base Sepolia: Correct explorer links (basescan.org)
- [ ] Hedera Testnet: Correct explorer links (hashscan.io)
- [ ] Chain icon shows correctly (🔵 vs ⬡)
- [ ] Chain ID displays correctly (84532 vs 296)

---

## 📚 Additional Resources

### Blockchain Documentation

- **Base Sepolia:** https://docs.base.org/using-base
- **Hedera Testnet:** https://docs.hedera.com/hedera
- **BaseScan API:** https://docs.basescan.org/
- **HashScan API:** https://docs.hashscan.io/

### Smart Contract ABIs

Located in your `packages/contracts` directory:

```
packages/contracts/contracts/MemecoinFactory.sol
packages/contracts/contracts/Memecoin.sol
packages/contracts/contracts/BondingCurve.sol
packages/contracts/contracts/LiquidityPoolFactory.sol
```

### Reference Files in air-fun-ai-orik

```
packages/frontend-streamer/src/components/BlockchainDeploymentModal.tsx  (main implementation)
packages/frontend-streamer/src/pages/StreamDashboardPage.tsx             (integration example)
USER_FLOWS.md                                                           (blockchain documentation)
```

---

## 🚀 Implementation Priority

### Phase 1: Core Modal (MVP)

1. Create modal component with layout
2. Implement step list with status icons
3. Add basic WebSocket/SSE listener
4. Show TX hash and addresses

### Phase 2: Polish

1. Add copy-to-clipboard buttons
2. Add blockchain explorer links
3. Implement elapsed time counter
4. Add minimize/reopen functionality

### Phase 3: Enhancement

1. Add animations and transitions
2. Improve mobile responsiveness
3. Add error recovery UI
4. Add success celebration effects

---

## ❓ Questions to Answer

When implementing this modal, consider:

1. **WebSocket vs SSE:** How does your backend send real-time updates?
2. **State Management:** Are you using Redux, Zustand, or Context API?
3. **UI Library:** Are you using Tailwind, Material-UI, or custom CSS?
4. **Chain Selection:** Does the streamer choose the chain, or is it automatic?
5. **Mock Mode:** Do you need a demo mode with fake deployments for testing?

---

## 🎯 Success Criteria

The modal is considered successful if:

✅ Streamer can **see every deployment step** in real-time
✅ Streamer can **copy addresses** with one click
✅ Streamer can **verify on blockchain explorer** immediately
✅ Streamer understands **what contracts were deployed**
✅ Streamer knows **how many tokens they received** (200M)
✅ Streamer can **minimize and continue working** without blocking
✅ Streamer sees **clear error messages** if deployment fails
✅ Modal works on **both Base and Hedera** chains
✅ Modal is **mobile-responsive**

---

**End of Prompt**

---

## 📞 Need Help?

If you have questions about implementing this modal:

1. Check the reference implementation: `packages/frontend-streamer/src/components/BlockchainDeploymentModal.tsx`
2. Review the blockchain documentation: `USER_FLOWS.md`
3. Test on both chains: Base Sepolia and Hedera Testnet
4. Verify contract addresses match the deployed contracts listed above

Good luck building! 🚀
