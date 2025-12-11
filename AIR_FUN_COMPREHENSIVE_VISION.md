# Air.Fun - Comprehensive Platform Vision & Technical Specification

**Last Updated:** December 2, 2025  
**Status:** Pre-Development Planning Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Platform Architecture Overview](#platform-architecture-overview)
3. [Deployment Modes](#deployment-modes)
4. [Core Features](#core-features)
5. [Tokenomics & Economy](#tokenomics--economy)
6. [AI Agent System](#ai-agent-system)
7. [Streaming Infrastructure](#streaming-infrastructure)
8. [Anti-Bot Protection](#anti-bot-protection)
9. [Technical Stack](#technical-stack)
10. [Open Questions & Design Decisions](#open-questions--design-decisions)
11. [Implementation Roadmap](#implementation-roadmap)
12. [Relationship to Kiro Development](#relationship-to-kiro-development)

---

## Executive Summary

### What is Air.Fun?

**Air.Fun** is a decentralized livestreaming platform that combines:

- **WebRTC video streaming** with interactive 3D AI agents
- **Pump.fun-style bonding curve** memecoin mechanics
- **AR/VR spatial computing** (Meta Quest 3, Immersive Web SDK)
- **Direct creator monetization** (95%+ revenue to creators vs 50-70% on Twitch/YouTube)
- **Story Protocol IP rights** for agent licensing and royalties

### The Core Innovation

**Streamers deploy clickable AR/VR AI agents** into their livestreams. Viewers interact with these agents using:

- Hand tracking (Meta Quest 3)
- Mouse/touch (desktop/mobile)
- Voice commands (future)

Each agent interaction can:

- Purchase memecoin via bonding curve
- Trigger payments/tips to streamer
- Participate in games/challenges
- Influence stream outcome
- Request content from streamer

### Key Differentiators

| Feature                 | Traditional Platforms   | Air.Fun                       |
| ----------------------- | ----------------------- | ----------------------------- |
| **Creator Revenue**     | 50-70% (Twitch/YouTube) | 95-99% (crypto-native)        |
| **Settlement Time**     | 30+ days                | Instant (on-chain)            |
| **Interactivity**       | Chat messages           | Clickable 3D AR agents        |
| **Monetization**        | Ads + Subs              | Memecoin bonding curve + tips |
| **Bot Protection**      | Minimal                 | Human-only agent interactions |
| **IP Rights**           | Platform owns           | Creator owns (Story Protocol) |
| **Geographic Coverage** | 50 countries            | 170+ countries (crypto)       |

---

## Platform Architecture Overview

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         AIR.FUN PLATFORM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │  Native Platform │              │   Filter Mode    │        │
│  │   (Standalone)   │              │  (Plugin/Overlay) │        │
│  └──────────────────┘              └──────────────────┘        │
│           │                                  │                   │
│           └──────────────┬───────────────────┘                  │
│                          │                                       │
│  ┌───────────────────────▼────────────────────────────────┐    │
│  │            CORE SERVICES LAYER                         │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ • Streaming Service (WebRTC + Mediasoup)              │    │
│  │ • Token Factory Service (Memecoin creation)           │    │
│  │ • Bonding Curve Service (Price calculations)          │    │
│  │ • AI Agent Service (Deployment, tracking, MCP)        │    │
│  │ • Story IP Service (IP registration, royalties)       │    │
│  │ • Payment Service (x402, USDair, crypto wallets)      │    │
│  │ • Real-Time Sync Service (CRDT, WebSocket)            │    │
│  └────────────────────────────────────────────────────────┘    │
│                          │                                       │
│  ┌───────────────────────▼────────────────────────────────┐    │
│  │            DATA & BLOCKCHAIN LAYER                     │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ • Supabase (PostgreSQL + Real-time)                   │    │
│  │ • Redis (Price caching, state sync)                   │    │
│  │ • Hedera (AIR token, memecoins, HCS)                  │    │
│  │ • Base Sepolia (Story Protocol, CDP deployment)       │    │
│  │ • IPFS/Arweave (Metadata, videos, permanence)         │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deployment Modes

Air.Fun operates in **two distinct modes** to maximize creator adoption and platform reach:

### Mode 1: Native Platform (Standalone App)

**Description:** Full-featured air.fun application with complete control over streaming, UI, and monetization.

**User Flow:**

```
Streamer
  ├─ Downloads Air.Fun app (iOS/Android/Desktop)
  ├─ Creates stream with title, thumbnail, memecoin
  ├─ Deploys AI agents with geospatial or screen-space anchors
  └─ Broadcasts WebRTC stream to air.fun servers

Viewer
  ├─ Opens Air.Fun app or web (air.fun/live/streamer-name)
  ├─ Sees streamer video + floating AR agents
  ├─ Clicks agents → Buys memecoin, tips, interacts
  └─ Participates in games/challenges
```

**Advantages:**

- Full platform control
- Custom UI/UX optimized for agent interactions
- Direct monetization (no third-party fees)
- Brand building for Air.Fun

**Challenges:**

- Cold start problem (need to attract both streamers AND viewers)
- Competing with established platforms (Twitch has 2B users)

---

### Mode 2: Filter/Plugin (Overlay on Existing Platforms)

**Description:** Air.Fun acts as an **overlay layer** injected into existing streaming platforms (Twitch, YouTube, Kick, pump.fun, Zora).

**User Flow:**

```
Streamer (on Twitch/YouTube/pump.fun)
  ├─ Installs Air.Fun Streamer Plugin (OBS plugin, browser extension)
  ├─ Deploys AI agents into their existing stream
  ├─ Agents rendered as overlay on top of video feed
  ├─ Continues streaming on Twitch/YouTube as normal
  └─ Air.Fun data channel syncs agent state to viewers

Viewer (watching on Twitch/YouTube/pump.fun)
  ├─ Installs Air.Fun Viewer Extension (Chrome/Firefox extension)
  ├─ Watches stream on Twitch/YouTube as usual
  ├─ Extension detects Air.Fun agents in stream
  ├─ Renders agents as interactive overlay
  ├─ Clicks agents → WebRTC DataChannel sends interaction
  └─ Buys memecoin, tips, participates in games
```

**Technical Implementation:**

**Streamer Side:**

```
OBS Plugin / Browser Extension
  ├─ Captures video feed from OBS/webcam
  ├─ Renders 3D agents using Three.js/WebGL
  ├─ Composites agents onto video stream
  ├─ Sends agent state via WebRTC DataChannel (parallel to video)
  └─ Broadcasts to Twitch/YouTube with agent metadata
```

**Viewer Side:**

```
Browser Extension (Chrome/Firefox)
  ├─ Detects Air.Fun metadata in stream (embedded in video description or data channel)
  ├─ Connects to Air.Fun WebRTC relay server
  ├─ Receives agent state via DataChannel (CRDT-synced)
  ├─ Renders agents as HTML/CSS overlay on top of Twitch/YouTube video
  ├─ Click events → Sends interaction to streamer + Air.Fun backend
  └─ Purchase flow → Opens Air.Fun payment modal
```

**Advantages:**

- **Zero cold start:** Leverage existing audiences on Twitch/YouTube/pump.fun
- **Low friction:** Streamers don't need to abandon their platforms
- **Incremental adoption:** Try Air.Fun features without full migration
- **Multi-platform reach:** Works across Twitch, Kick, YouTube, pump.fun, Zora

**Challenges:**

- Platform ToS violations (Twitch/YouTube may block overlays)
- Limited control over video stream quality
- Dependency on third-party platforms

---

### Hybrid Strategy (Recommended)

**Phase 1 (Months 1-3):** Launch Filter Mode

- Build browser extension + OBS plugin
- Target crypto-native streamers on pump.fun, Zora
- Prove concept with 50-100 beta streamers

**Phase 2 (Months 4-6):** Launch Native Platform

- Once filter gains traction, invite streamers to migrate
- Offer better monetization on native platform (no Twitch cut)
- Position as "Twitch killer" for crypto creators

**Phase 3 (Months 7-12):** Scale Both

- Filter mode: Mainstream platforms (Twitch, YouTube)
- Native platform: Crypto-native creators, exclusive features

---

## Core Features

### 1. Livestreaming Infrastructure

**WebRTC Video Streaming:**

- **Streamer:** Broadcasts video via WebRTC (Mediasoup SFU)
- **Viewers:** Consume video stream with <100ms latency
- **Bandwidth:** 2-5 Mbps per viewer (video) + 5-10 Kbps (agent state)

**Stream Lifecycle:**

```
1. Streamer starts stream → Auto-creates memecoin
2. Viewers join stream → WebRTC consumer transport
3. Streamer deploys agents → Real-time sync to all viewers
4. Stream ends → Summary generated, final market cap recorded
```

**AR/VR Support:**

- **Meta Quest 3:** WebXR passthrough mode, hand tracking
- **Desktop/Mobile:** Three.js 3D rendering in browser
- **Geospatial AR:** RTK-GPS anchors for outdoor streams
- **Screen-space AR:** Agents anchored to video frame (private streams)

---

### 2. Memecoin Bonding Curve

**Automatic Token Creation:**

```typescript
// When streamer starts stream:
const memecoin = await createMemecoin({
  name: "Streamer Name Coin",
  symbol: generateSymbol(streamerName), // "PTRX", "KIRO", etc.
  supply: 1_000_000_000, // 1 billion tokens
  chain: "hedera" | "base-sepolia",
});

// Initialize bonding curve:
const bondingCurve = {
  formula: "price = k * tokensSold^2", // Quadratic
  k: 0.000000001,
  graduationThreshold: 69000, // $69k market cap
};
```

**Price Calculation:**

```
Current price = k * (tokens sold)^2
Purchase cost = ∫[tokensSold, tokensSold + amount] k * x^2 dx
                = k/3 * [(tokensSold + amount)^3 - tokensSold^3]

Example:
  k = 0.000000001
  Tokens sold: 100,000,000
  Buy 1,000,000 tokens
  Cost ≈ $10.03
```

**Fee Distribution:**

- **98% to creator** (instant settlement)
- **2% to platform** (infrastructure costs)

**Graduation:**

```
When market cap reaches $69,000:
  1. Create MEMECOIN/AIR liquidity pool
  2. Deposit remaining bonding curve tokens + equivalent AIR
  3. Burn LP tokens (rug-pull protection)
  4. Token now tradeable on DEX permanently
```

---

### 3. AI Agent System

**Agent Identity & Standards:**

- **ERC-8004:** Agent identity NFT (on-chain ownership)
- **MCP (Model Context Protocol):** Agent-to-agent communication
- **x402 Standard:** Agent payments (USDair stablecoin)

**Agent Traits:**

**Visual:**

- Avatar representing streamer (face mapping)
- Custom 3D model (uploaded by streamer)
- Famous characters (subject to IP rights via Story Protocol)
- Independent autonomous agents

**Movement:**

- **Pre-set paths:** Agent follows scripted movement on screen
- **Voice-controlled:** Streamer gives voice commands ("move left")
- **Viewer-controlled:** Viewers pay to move agent (gamification)
- **Autonomous:** Agent moves based on AI decisions
- **Arbitrary:** Random movement if streamer allows

**Interaction Modes:**

- **Click to buy:** Agent acts as buy button for memecoin
- **Click to tip:** Direct payment to streamer wallet
- **Click to request:** Pay agent to request action from streamer
- **Click to play:** Trigger mini-game with agent
- **Click to chat:** Private conversation with agent (AI-powered)

**Agent Deployment:**

```typescript
// Streamer deploys agent:
const agent = await deployAgent({
  templateId: "buy_button" | "challenge_giver" | "predictor" | "leaderboard",

  // Visual
  avatarType: "streamer_face" | "custom_3d" | "famous_character" | "autonomous",
  modelUrl: "ipfs://...",
  color: "#FF5733",

  // Positioning
  mode: "screen-space" | "geospatial",
  position: { x: 0.5, y: 0.3, z: 1.0 }, // Screen-space coords or GPS

  // Behavior
  movement: {
    type: "preset" | "voice" | "viewer" | "autonomous" | "arbitrary",
    path: [...], // If preset
    allowViewerControl: true,
    viewerControlPrice: 5 // $5 to move agent
  },

  // Payments
  walletAddress: "0x...", // Receives payments
  bankAccount: {...}, // For virtual card payments (Revolut sandbox)

  // MCP Connections
  mcpServers: [
    "stripe-mcp-server",
    "memory-mcp-server",
    "brave-search-mcp-server"
  ],

  // Permissions
  canReceivePayments: true,
  canSendPayments: true, // For gamification (agent pays viewers)
  allowViewerInstructions: true
});
```

**Agent-to-Agent Communication:**

- **MCP Protocol:** Standardized message passing
- **Use Cases:**
  - Agent requests payment from another agent
  - Agent delegates task to another agent
  - Agents coordinate for multi-agent games

**Bi-Directional Payments:**

```
Viewer → Agent (standard tipping)
Agent → Viewer (gamification rewards)

Example:
  Viewer plays game with agent
  Viewer wins challenge
  Agent sends $50 reward to viewer's wallet
  (Streamer pre-approves budget for agent)
```

---

### 4. Anti-Bot Protection (Critical Innovation)

**Problem Statement:**

- Pump.fun and other memecoin platforms suffer from bot manipulation
- 70%+ of tokens created by bots
- Bots front-run trades, manipulate prices
- Unfair for human traders

**Air.Fun Solution:**

**Clickable Agent-Only Trading:**

```
Traditional DEX: Bot sends transaction directly to smart contract
Air.Fun: ALL purchases MUST click interactive 3D agent

Flow:
  1. Viewer sees agent in AR/VR
  2. Viewer performs gesture (hand pinch on Quest 3, mouse click on desktop)
  3. Agent detects human interaction (gesture recognition)
  4. Agent validates interaction is from real user (not scripted)
  5. Only then: Purchase transaction submitted to smart contract
```

**Bot Detection Mechanisms:**

**1. Gesture Validation:**

```typescript
// Meta Quest 3 Hand Tracking
const isRealHuman = validateGesture({
  handPose: handTrackingData,
  pinchStrength: 0.8, // Requires realistic pinch
  gestureSpeed: withinHumanRange, // Bots too fast or too slow
  naturalMovement: true, // Realistic hand motion curve
});
```

**2. Spatial Positioning:**

```typescript
// Agent placed in 3D space (AR)
// Bot cannot "see" agent without rendering AR scene
// Requires WebXR session, camera passthrough, spatial tracking
// Too complex for bots to emulate
```

**3. Time-Based Challenges:**

```typescript
// Agent presents CAPTCHA-like challenge:
Agent: "Pinch the agent 3 times in 2 seconds";
("Move your hand in a circle");
("Point at the red cube");

// Human can do easily
// Bot cannot predict random challenge
```

**4. Session Verification:**

```typescript
// Viewer must maintain active WebRTC session
// Requires video stream consumption (bandwidth proof)
// Bots cannot fake video consumption at scale
```

**Result:**

- **95%+ bot exclusion** (vs 30% on pump.fun)
- **Fairer price discovery** (only real humans trading)
- **Higher quality community** (engaged viewers, not snipers)

---

### 5. Gamification & Stream Interactivity

**LiveCoin (Temporary Stream Token):**

```
Problem: Memecoin is permanent, less volatile
Solution: Create temporary LiveCoin for single stream

Characteristics:
  - Created at stream start
  - Highly volatile (bonding curve with lower k)
  - Expires when stream ends
  - Viewer actions influence price

Example:
  Streamer playing game
  Viewers bet LiveCoin on outcome
  Winner takes all LiveCoin
  LiveCoin price skyrockets during exciting moments
```

**Viewer Influence Mechanics:**

**1. Challenge Bounties:**

```
Viewer: "Beat this boss and I'll pay $50!"
Agent: Displays bounty on screen
Streamer: Accepts challenge
If successful: Agent pays $50 to streamer
Other viewers: Can add to bounty pool
```

**2. Setlist Voting (Musicians):**

```
Agent aggregates song requests
Weighted by payment amount:
  - $1 = suggestion
  - $5 = priority queue
  - $20 = guaranteed play
Agent displays top requests
Musician picks from list
```

**3. Interactive Polls:**

```
Agent: "What should streamer do next?"
  A. Play scary game ($10 to vote)
  B. Do Q&A ($5 to vote)
  C. Sing karaoke ($15 to vote)

Viewers click agent to vote + pay
Highest-paid option wins
Funds go to streamer
```

**4. Agent Battles:**

```
Streamer deploys 2 agents
Viewers split into teams
Each team funds their agent
Agents compete in challenge
Winning team's agent celebrates
Losing team's funds distributed to winners
```

---

### 6. Story Protocol Integration

**IP Asset Registration:**

```typescript
// When agent is deployed:
const ipAsset = await registerAgentAsIP({
  agentId: agent.id,
  metadata: {
    name: agent.name,
    description: "3D AR agent for livestreaming",
    image: agent.avatarUrl,
    creator: streamer.walletAddress,
  },
  chain: "base-sepolia",
});

// Attach PIL (Programmable IP License):
await attachLicense({
  ipAssetId: ipAsset.id,
  terms: {
    commercialUse: true,
    derivativeRoyalty: 0.05, // 5% royalty on derivatives
    attribution: true,
  },
});
```

**Derivative Licensing:**

```
Streamer A creates "CoolBot" agent
Streamer B wants to use CoolBot in their stream

Flow:
  1. Streamer B licenses CoolBot as derivative
  2. Story Protocol automatically routes 5% of earnings to Streamer A
  3. Streamer B can customize appearance but pays royalty
  4. All tracked on-chain transparently
```

**Royalty Token Issuance:**

```
When memecoin graduates ($69k market cap):
  1. Issue 1M Royalty Tokens (ERC-20) via Story Protocol
  2. Distribution:
     - 80% to streamer (800k tokens)
     - 20% to public sale on IPfi marketplace (200k tokens)
  3. Royalty Tokens represent fractional ownership of agent IP
  4. Derivatives pay royalties → Distributed to token holders
```

**IPfi Marketplace:**

```
Viewers can buy/sell Royalty Tokens
Price discovery based on agent popularity
APY calculation:
  APY = (Annual Royalties / Token Market Cap) * 100

Example:
  Agent generates $10k/year in derivative royalties
  200k tokens at $0.10 each = $20k market cap
  APY = ($10k / $20k) * 100 = 50%
```

---

## Tokenomics & Economy

### Token Architecture

**1. AIR Token (Platform Token):**

```
Purpose: Liquidity pair for ALL memecoins
Supply: TBD (possibly 1 billion)
Distribution:
  - 40% Liquidity pools
  - 30% Team & development
  - 20% Community rewards
  - 10% Treasury

Use Cases:
  - Liquidity pairing (MEMECOIN/AIR pools after graduation)
  - Governance (vote on platform changes)
  - Staking (unlock premium features)
  - Fee discounts (pay fees in AIR for 50% discount)
```

**Question:** Why AIR instead of SOL (like pump.fun)?

**Answer:**

- **Platform Control:** AIR captures value from all memecoins
- **Ecosystem Lock-In:** Users need AIR to trade graduated tokens
- **Revenue:** Platform owns significant AIR supply (price appreciation)
- **Governance:** AIR holders vote on fee structure, features

**Trade-off:**

- pump.fun uses SOL (already liquid, $50B market cap)
- Air.Fun uses AIR (new token, needs liquidity bootstrapping)
- **Risk:** If AIR has no liquidity, users can't trade memecoins

---

**2. USDair (Stablecoin):**

```
Purpose: Agent-to-agent payments, inter-agent commerce
Type: Fiat-backed stablecoin (1 USDair = $1 USD)
Standard: x402 agent payment protocol
Issuance: Backed by USDC reserves

Use Cases:
  - Agent pays viewer for winning game
  - Agent purchases service from another agent
  - Agent pays for API calls (MCP server usage)
  - DeFi integration (lending, liquidity provision)
```

**Why USDair instead of USDC?**

**Answer:**

- **x402 Integration:** Native support for agent payment protocol
- **Platform Control:** Air.Fun controls stablecoin supply
- **Fee Capture:** Small fee on USDair transactions (0.1%)
- **DeFi Ecosystem:** Create USDair lending markets, yield products

**Risk:**

- Regulatory scrutiny (stablecoin issuance)
- Collateral management (need 1:1 USDC backing)
- User trust (prefer USDC over new stablecoin)

---

**3. Memecoin (Per-Stream Token):**

```
Purpose: Speculative trading for individual stream
Supply: 1 billion per memecoin
Lifespan: Permanent (survives after stream ends)

Bonding Curve Phase (Pre-Graduation):
  - Price = k * tokensSold^2
  - Trading only via Air.Fun agents
  - 98% to creator, 2% to platform

Post-Graduation (After $69k):
  - Listed on DEX with MEMECOIN/AIR pool
  - Tradeable by anyone (not just Air.Fun users)
  - LP tokens burned (cannot rug-pull)
```

**Can one streamer have multiple memecoins?**

**Answer:** Yes (like pump.fun)

- Streamer can create new memecoin per stream
- Or reuse existing memecoin across multiple streams
- Viewer choice: Which token to buy?

---

**4. LiveCoin (Optional, Per-Stream Temporary Token):**

```
Purpose: High-volatility gamification token
Supply: Variable (created during stream)
Lifespan: Single stream only (expires when stream ends)

Characteristics:
  - Created by viewer interactions (challenges, bets)
  - Price influenced by stream excitement (peaks during big moments)
  - Winners of games receive LiveCoin
  - Can convert LiveCoin → Memecoin at end of stream (fixed ratio)

Example:
  Streamer plays game
  Viewers bet 1000 LiveCoin on outcome
  Stream gets exciting → LiveCoin price 10x
  Winners convert 10,000 LiveCoin → 1,000 Memecoin
```

**Question:** Is LiveCoin necessary or too complex?

**Discussion:**

- **Pro:** Adds excitement, viewers influence stream in real-time
- **Con:** Complex UX, users must understand 2 tokens
- **Recommendation:** Launch without LiveCoin, add later if needed

---

### Liquidity Bootstrapping Problem

**Challenge:** AIR token needs liquidity for MEMECOIN/AIR pools

**Solutions:**

**Option 1: Graduated tokens can pair with SOL instead of AIR**

```
Pro: Instant liquidity (SOL is liquid)
Con: Doesn't capture value for AIR token
```

**Option 2: Platform provides AIR liquidity**

```
Pro: Builds AIR liquidity over time
Con: Requires significant AIR treasury
Implementation:
  - Platform mints AIR to pair with graduated memecoins
  - Over time, AIR gains liquidity as more tokens graduate
```

**Option 3: Hybrid (SOL + AIR dual pools)**

```
Pro: Best of both worlds
Con: Complex UX (users choose which pool to trade)
Implementation:
  - Graduated token creates both MEMECOIN/SOL and MEMECOIN/AIR pools
  - Arbitrage keeps prices aligned
```

**Recommended:** Option 2 (AIR-only) for long-term value capture

---

## Streaming Infrastructure

### Geospatial vs Screen-Space AR - Detailed Analysis

**IMPORTANT NOTE:** This section was updated on December 3, 2025, based on detailed analysis of Meta SDK capabilities and Air.Fun streaming use cases. See `META_SDK_STREAMING_USECASES_ANALYSIS.md` for complete discussion.

#### **Meta SDK Clarification:**

**Meta Immersive Web SDK (Quest 3 - Current):**

- ❌ NO built-in GPS/geospatial awareness
- ✅ Local spatial tracking only (room-scale VR/AR)
- Uses Quest's inside-out tracking (cameras on headset)
- GPS must be manually injected via JavaScript Geolocation API

**Meta Spatial SDK (Mobile - Future):**

- ❌ NO built-in GPS anchoring
- ✅ Local spatial tracking using ARKit/ARCore
- GPS must be manually injected
- Works with Google ARCore Geospatial API for GPS features

**Key Insight:** Neither Meta SDK provides GPS anchoring out of the box. For geospatial features, we must manually read device GPS and inject it into our positioning system.

---

### Air.Fun Streaming Modes (Prioritized by Implementation)

#### **Mode 1: Screen-Space AR (Privacy-Safe)** ⭐ **PRIMARY - 95% OF USE CASES**

**Use Case:** Streamer at home/studio → Global viewers → Location irrelevant

**Location Requirements:**

- ❌ Streamer GPS: NOT needed, NOT disclosed
- ❌ Viewer GPS: NOT needed
- ❌ Agent GPS: NOT needed
- ✅ Agent positioning: Relative to video frame or streamer's body/face

**Technical Implementation:**

```typescript
// Streamer side (Quest 3 or Desktop):
const agent = {
  position: {
    mode: "screen-space",
    // Relative to video frame coordinates (0-1 range)
    x: 0.5, // Center horizontally
    y: 0.3, // Upper third vertically
    z: 1.0, // 1 meter from camera
  },
  // OR relative to streamer's body
  anchor: "face", // or "left-hand", "right-hand", "chest"
  offset: { x: 0.2, y: 0.1, z: 0.5 }, // 20cm right, 10cm up, 50cm forward
};

// Viewer side (anywhere in world):
// Receives agent position via WebRTC DataChannel
// Renders agent at same screen-space coordinates
// Result: Everyone sees agent in same spot relative to streamer
```

**Meta Immersive Web SDK Usage:**

- Hand tracking for streamer to place agents (pinch gesture)
- Passthrough AR to see physical space while streaming
- Local spatial tracking (no GPS needed)
- WebXR session for immersive experience

**Example Scenarios:**

- Gaming streamer (agent floats next to face)
- Musician (agent on instrument)
- Podcast (agent between two hosts)
- Tutorial/Educational content (agent highlights items)

**Advantages:**

- ✅ Complete privacy (no location data)
- ✅ Works globally (any viewer, any country)
- ✅ Simple implementation (coordinate system is 2D/3D relative)
- ✅ Perfect for Meta hackathon (showcases Immersive SDK features)
- ✅ Covers 95% of air.fun use cases

**Disadvantages:**

- ❌ No real-world anchoring (agents don't persist in physical space)

**For Meta Hackathon (Dec 9 deadline):**

```
✅ FOCUS HERE - This is your winning demo
- Streamer wears Quest 3
- Uses hand tracking to place agents in passthrough AR
- Agents float around streamer in screen space
- Viewers (Quest 3 or desktop) see same agents
- Click agents to trigger payments/interactions
```

---

#### **Mode 2: Location-Aware Streaming (Surroundings Matter)**

**Use Case:** Streamer at iconic location (Eiffel Tower) → Global viewers → Visual context important

**Location Requirements:**

- ⚠️ Streamer GPS: Optional (for metadata/map display only)
- ❌ Viewer GPS: NOT needed
- ❌ Agent GPS: NOT needed (still screen-space)
- ✅ Visual context: Surroundings visible in video feed

**Technical Implementation:**

```typescript
const stream = {
  title: "Live from Eiffel Tower!",
  location: {
    name: "Eiffel Tower, Paris",
    coordinates: { lat: 48.8584, lng: 2.2945 }, // Optional metadata
    showOnMap: true, // Display in stream gallery
    shareExactGPS: false, // Only city-level precision
  },
  agents: [
    {
      position: { mode: "screen-space", x: 0.6, y: 0.4, z: 2.0 },
      // Agent appears to float near Eiffel Tower in video
      // But NOT anchored to real-world GPS coordinates
    },
  ],
};

// Viewer experience:
// - Sees "📍 Paris, France" badge on stream
// - Clicks stream → Sees Eiffel Tower in video background
// - Agents float in screen-space (no GPS anchoring needed)
// - Visual context provides "location feel"
```

**Meta Immersive SDK Usage:**

- Same as Mode 1 (passthrough AR, hand tracking)
- Streamer can see physical surroundings through Quest 3
- Agents placed relative to what streamer sees
- GPS only used for stream metadata (not agent positioning)

**Example Scenarios:**

- Street performer livestreams in city square
- Travel vlogger touring landmarks
- Outdoor festival coverage
- Sports event commentary

**Advantages:**

- ✅ Showcases real-world streaming use case
- ✅ No complex GPS anchoring needed
- ✅ Privacy-flexible (city-level vs exact GPS)
- ✅ Works with global viewers

**Disadvantages:**

- ❌ Agents don't persist after stream ends
- ❌ Viewers not physically present can't experience real-world positioning

**For Meta Hackathon:**

```
⚠️ OPTIONAL ENHANCEMENT to Mode 1
- Add GPS metadata to stream object
- Display "Streaming from: [City]" badge
- Show stream location on gallery map
- Agents still screen-space (no GPS anchoring)
```

---

#### **Mode 3A: Persistent Geospatial Agent Placement** (FUTURE - POST-HACKATHON)

**Use Case:** Streamer at special location → Places agents at GPS coordinates → Viewers control agent movement remotely

**Location Requirements:**

- ✅ Streamer GPS: REQUIRED (to anchor agents)
- ❌ Viewer GPS: NOT required (viewing remotely)
- ✅ Agent GPS: REQUIRED (anchored to real-world coordinates)
- ✅ Persistent: Agents stay after stream ends

**Technical Implementation:**

**SDK:** Meta Immersive SDK + **Google ARCore Geospatial API** OR **Niantic Lightship VPS**

```typescript
// Streamer at Eiffel Tower:
const streamerGPS = await navigator.geolocation.getCurrentPosition();
// GPS: 48.8584° N, 2.2945° E

// Place agent at specific GPS coordinate:
const agent = {
  position: {
    mode: "geospatial",
    gps: {
      latitude: 48.8584,
      longitude: 2.2945,
      altitude: 324, // meters (top of Eiffel Tower)
    },
    // Fine-tuned with visual positioning:
    vpsAnchor: "eiffel-tower-top-platform", // Niantic Lightship scan
  },
  persistent: true, // Stays after stream ends
  allowViewerControl: true, // Viewers can move it
  movementPrice: 5, // $5 per movement command
};

// Remote viewer (anywhere in world):
// - Sees streamer's video with Eiffel Tower
// - Sees agent floating on tower top
// - Pays $5 to command: "Move agent to base of tower"
// - Agent GPS updates: altitude: 0 meters
// - Future visitors see agent at new position
```

**SDK Requirements:**

**For Quest 3 (Streamer):**

- Meta Immersive Web SDK (place agents in AR)
- Manual GPS injection via JavaScript Geolocation API
- WebXR Anchors API (experimental - persist spatial anchors)

**For Mobile (Future - when adding mobile support):**

- Meta Spatial SDK (ARCore/ARKit foundation)
- Google ARCore Geospatial API (GPS + visual positioning)
- OR Niantic Lightship VPS (scan location beforehand)

**RTK-GPS Enhancement (From Your Other Project):**

```typescript
// If using RTK-GPS hardware (centimeter precision):
const rtkGPS = await getRTKPosition(); // Requires base station
// Precision: ±2cm vs ±5m standard GPS

const agent = {
  position: {
    gps: {
      latitude: rtkGPS.lat, // Ultra-precise
      longitude: rtkGPS.lng,
      altitude: rtkGPS.alt,
      accuracy: 0.02, // 2cm
    },
  },
};

// Use case: Multiple agents at same venue need precise spacing
// Example: 10 agents in 10m x 10m plaza, each 1m apart
```

**Example Scenarios:**

- Treasure hunt game (find agents across city)
- Virtual monuments (persistent art installations)
- Museum tours (agents at specific exhibits)
- City guide (agents at historical landmarks)

**Advantages:**

- ✅ Persistent agents (treasure hunt, virtual monuments)
- ✅ Viewer interaction (pay to control agent position)
- ✅ Unique gamification (move agent to collect rewards)
- ✅ Great for advertising venues

**Disadvantages:**

- ❌ Complex GPS + visual positioning needed
- ❌ Requires scanning location beforehand (Niantic VPS)
- ❌ Viewers can't see in AR without visiting location
- ❌ NOT possible in 6 days for hackathon

**Timeline:**

```
❌ NOT for Meta Hackathon (too complex)
✅ Phase 2 (Months 4-6) - After MVP launch
✅ Requires: Google ARCore Geospatial API OR Niantic Lightship
✅ RTK-GPS optional (for ultra-precision at venues)
```

---

#### **Mode 3B: Location-Gated AR Experiences** (FUTURE - POST-HACKATHON)

**Use Case:** Streamer places agents at GPS location → Only visible when physically present → Drive foot traffic

**Location Requirements:**

- ✅ Streamer GPS: REQUIRED (to place agents)
- ✅ Viewer GPS: REQUIRED (to gate access)
- ✅ Agent GPS: REQUIRED (anchored to location)
- ✅ Use case: "Come to this location to unlock content"

**Technical Implementation:**

```typescript
// Streamer at concert venue:
const agent = {
  position: {
    mode: "geospatial",
    gps: { lat: 48.8584, lng: 2.2945, altitude: 10 },
  },
  accessControl: {
    type: "geofence",
    radius: 50, // 50 meters
    message: "Come to Eiffel Tower to see this agent!",
  },
  reward: {
    type: "nft",
    value: "Exclusive Eiffel Tower NFT",
  },
};

// Remote viewer (NOT at location):
// - Sees stream video
// - Sees grayed-out agent icon
// - Message: "🔒 Visit Eiffel Tower to unlock"
// - GPS distance shown: "You're 5,342 km away"

// Viewer physically at Eiffel Tower:
const viewerGPS = await navigator.geolocation.getCurrentPosition();
const distance = calculateDistance(agent.position.gps, viewerGPS);

if (distance < 50) {
  // Within 50m
  // ✅ Agent unlocked in AR
  // Viewer sees agent through phone camera (Meta Spatial SDK)
  // Clicking agent claims NFT reward
}
```

**SDK Requirements:**

**For Mobile (Primary use case):**

- Meta Spatial SDK (mobile AR)
- Google ARCore Geospatial API (position agent at GPS)
- Geolocation API (verify viewer is at location)
- Camera access (AR view)

**For Quest 3 (Advanced):**

- Meta Immersive Web SDK + manual GPS
- WebXR Anchors API (persist agents)
- Geolocation API (verify presence)

**Example Scenarios:**

- Concert/festival exclusive content
- Tourism (unlock city guide at landmarks)
- Retail (unlock deals when visiting store)
- Events (attendance verification + rewards)

**Advantages:**

- ✅ Drives real-world foot traffic (advertising, tourism)
- ✅ Gamification (treasure hunts, scavenger hunts)
- ✅ Exclusive content for attendees
- ✅ Post-stream engagement (agents persist)

**Disadvantages:**

- ❌ Complex: GPS + AR + access control
- ❌ Requires mobile app (not just web)
- ❌ Dependent on GPS accuracy (5-10m error possible)
- ❌ NOT feasible for hackathon

**Timeline:**

```
❌ NOT for Meta Hackathon
✅ Phase 3 (Months 7-12) - After mobile app launch
✅ Requires: Meta Spatial SDK + ARCore Geospatial API
✅ Great for partnerships with venues/events
```

---

### SDK Comparison Matrix

| Feature             | Meta Immersive SDK (Quest 3) | Meta Spatial SDK (Mobile) | Google ARCore Geospatial | RTK-GPS               | Niantic Lightship VPS |
| ------------------- | ---------------------------- | ------------------------- | ------------------------ | --------------------- | --------------------- |
| **Platform**        | Quest 3 headset              | iOS/Android phones        | Android phones           | Any device + hardware | iOS/Android           |
| **Positioning**     | Room-scale VR/AR             | Phone AR (surfaces)       | GPS + visual             | GPS (ultra-precise)   | GPS + 3D scans        |
| **Accuracy**        | Centimeter (local)           | Centimeter (local)        | Meter-level (global)     | Centimeter (global)   | Centimeter (global)   |
| **GPS Aware**       | ❌ No (manual injection)     | ❌ No (manual injection)  | ✅ Yes (built-in)        | ✅ Yes (hardware)     | ✅ Yes (cloud maps)   |
| **Use Case**        | Mode 1, 2                    | Mode 1, 2 (mobile)        | Mode 3A, 3B              | Mode 3A (precision)   | Mode 3A, 3B           |
| **Complexity**      | Low                          | Low                       | Medium                   | High (hardware)       | High (pre-scan)       |
| **Hackathon Ready** | ✅ YES                       | ⚠️ Mobile only            | ❌ NO                    | ❌ NO                 | ❌ NO                 |

---

### Implementation Priority for Air.Fun

**For Meta Hackathon (Dec 9 - 6 days):**

| Mode                         | GPS Needed       | SDK                  | Hackathon Ready | Priority    | Timeline    |
| ---------------------------- | ---------------- | -------------------- | --------------- | ----------- | ----------- |
| **Mode 1: Privacy Studio**   | ❌ None          | Meta Immersive       | ✅ YES          | 🔥 CRITICAL | Now (Dec 9) |
| **Mode 2: Location Context** | ⚠️ Metadata only | Meta Immersive       | ✅ YES          | 📌 Optional | Now (Dec 9) |
| **Mode 3A: Persistent GPS**  | ✅ Required      | ARCore Geo + RTK     | ❌ NO           | 🎯 High     | Months 4-6  |
| **Mode 3B: Geofenced AR**    | ✅ Required      | ARCore Geo + Spatial | ❌ NO           | 🎨 Medium   | Months 7-12 |

**✅ RECOMMENDED FOCUS: Mode 1 (Screen-Space AR) for Meta Hackathon**

This mode:

- Showcases Meta Immersive Web SDK capabilities
- Demonstrates hand tracking (impressive feature)
- Solves real problem (streamer monetization with interactive agents)
- Achievable in 6 days
- No GPS complexity
- Covers 95% of air.fun use cases

**Optional:** Add Mode 2 metadata (city-level location badge) if time permits

---

### Hybrid Approach (Streamer Choice)

```typescript
// Streamer selects mode on stream creation:
const streamConfig = {
  mode: "screen-space" | "location-aware" | "geospatial" | "geofenced",

  privacy: {
    "screen-space": "GPS hidden (global viewers)",
    "location-aware": "City-level GPS (global viewers)",
    geospatial: "Exact GPS shared (persistent agents)",
    geofenced: "Exact GPS + attendance required",
  },
};

// Implementation:
switch (streamConfig.mode) {
  case "screen-space":
    // Mode 1: No GPS, agents relative to video frame
    break;
  case "location-aware":
    // Mode 2: Optional city-level GPS metadata
    break;
  case "geospatial":
    // Mode 3A: Full GPS anchoring (future)
    break;
  case "geofenced":
    // Mode 3B: GPS + access control (future)
    break;
}
```

---

### WebRTC Architecture

**Streamer Side:**

```
Streamer App
  ├─ MediaStream (camera + microphone)
  ├─ Three.js Scene (3D agents rendered)
  ├─ Composite layer (video + agents)
  ├─ WebRTC PeerConnection
  │   ├─ MediaTrack (video/audio)
  │   └─ DataChannel (agent state, CRDT sync)
  └─ Broadcasts to Mediasoup SFU
```

**Viewer Side:**

```
Viewer App
  ├─ WebRTC PeerConnection (receives video)
  ├─ DataChannel (receives agent state)
  ├─ CRDT State (Yjs/Automerge for conflict-free sync)
  ├─ Three.js Scene (renders agents locally)
  ├─ Hand Tracking (Meta Quest 3) or Mouse/Touch
  └─ Click event → Send interaction via DataChannel
```

**State Synchronization (CRDT):**

```javascript
// Agent state synced across all viewers using CRDT
const agentState = {
  id: "agent-001",
  position: { x: 0.5, y: 0.3, z: 1.0 },
  rotation: { x: 0, y: 45, z: 0 },
  animation: "idle",
  clickCount: 127,
  lastClicked: "user-456",
  balance: 1250.5,
};

// Yjs syncs state via WebRTC DataChannel
// Multiple users can click simultaneously → No conflicts
// Last-write-wins with timestamp resolution
```

**Bandwidth Analysis:**

```
Per Viewer:
  - Video stream: 2.5 Mbps (H.264 encoded)
  - Audio stream: 50 Kbps
  - Agent state updates: 5-10 Kbps (CRDT diffs)
  - Total: ~2.56 Mbps

Per Stream (1000 viewers):
  - Mediasoup SFU distributes 1 stream → 1000 copies
  - Bandwidth: 2.56 Mbps × 1000 = 2,560 Mbps (2.5 Gbps)
  - Cost: ~$100-200/hour (AWS egress)
```

---

### Filter Mode Technical Implementation

**OBS Plugin (Streamer):**

```
OBS Studio
  ├─ Video Source (webcam)
  ├─ Air.Fun Plugin (injected)
  │   ├─ Three.js renderer (3D agents)
  │   ├─ Composites agents onto video
  │   └─ Embeds agent metadata in RTMP stream
  └─ RTMP Output → Twitch/YouTube

Parallel:
  ├─ Air.Fun WebRTC relay server
  └─ Sends agent state to viewers via DataChannel
```

**Browser Extension (Viewer):**

```
Chrome Extension
  ├─ Detects Air.Fun metadata in Twitch/YouTube stream
  │   └─ Embedded in video description or RTMP metadata
  ├─ Connects to Air.Fun WebRTC relay
  ├─ Receives agent state via DataChannel
  ├─ Injects HTML/CSS overlay on Twitch video player
  ├─ Renders 3D agents using Three.js
  └─ Click events → Air.Fun backend (purchase flow)
```

**Challenges:**

- **Platform ToS:** Twitch/YouTube may block extensions
- **Video Quality:** Cannot control encoding (Twitch decides)
- **Latency:** Additional 1-2 seconds from RTMP transcoding

**Mitigation:**

- Position as "viewer enhancement tool" (like BetterTTV)
- Open-source extension (transparency)
- No modification of Twitch video (overlay only)

---

## Technical Stack

### Frontend

**Web App (Desktop/Mobile):**

- React 18 + TypeScript
- Vite (bundler)
- Three.js + @react-three/fiber (3D rendering)
- @react-three/xr (WebXR for Quest 3)
- Tailwind CSS (styling)
- Socket.io-client (real-time updates)

**Browser Extension (Filter Mode):**

- Vanilla JavaScript (lightweight)
- WebExtensions API (Chrome/Firefox compatible)
- Three.js (minimal build)
- Content script injection

**Mobile App:**

- React Native + Expo
- Three.js via expo-gl
- WebRTC via react-native-webrtc

**Meta Quest 3:**

- WebXR Device API
- Immersive Web SDK
- Hand Tracking API
- Passthrough Mode

---

### Backend

**Node.js Services:**

- Express (REST API)
- Socket.io (WebSocket server)
- Mediasoup (WebRTC SFU)
- Bull (job queue for video processing)

**Database:**

- Supabase (PostgreSQL + real-time subscriptions)
- Redis (price caching, session storage)

**Blockchain:**

- Hedera SDK (Hedera Consensus Service, Token Service)
- ethers.js (Base Sepolia, Ethereum)
- Thirdweb SDK (multi-chain support)

**Storage:**

- IPFS (Pinata) - Metadata, agent models
- Arweave - Permanent storage
- S3 (AWS) - Video thumbnails, temporary files

---

### Smart Contracts

**Hedera:**

- AIR Token (HTS)
- Memecoin Factory (HTS)
- Bonding Curve Contract (Solidity on Hedera EVM)
- Liquidity Pool Factory

**Base Sepolia:**

- Story Protocol Integration
- IP Asset Registry
- Royalty Token Module
- Licensing Module

**Deployment:**

- Hardhat (development, testing)
- Coinbase Developer Platform SDK (Base deployment)

---

### AI & Agent Infrastructure

**MCP (Model Context Protocol):**

- MCP servers for agent communication
- Suggested servers:
  - `stripe-mcp-server` (payments)
  - `memory-mcp-server` (agent memory)
  - `brave-search-mcp-server` (web search)
  - Custom Air.Fun MCP server (platform data)

**x402 Protocol:**

- Agent payment standard
- USDair stablecoin integration
- Payment routing between agents

**Agent Runtime:**

- Hedera AI Agent Kit (on-chain agents)
- LangChain (agent orchestration)
- OpenAI API / Anthropic Claude (LLM)

---

## Open Questions & Design Decisions

### 1. AIR Token vs SOL for Liquidity Pairs

**Question:** Should graduated memecoins pair with AIR or SOL?

**Option A: AIR Token (Current Plan)**

- ✅ Captures value for platform
- ✅ Creates AIR token utility
- ❌ Requires bootstrapping AIR liquidity
- ❌ Lower initial liquidity than SOL

**Option B: SOL (like pump.fun)**

- ✅ Instant liquidity ($50B SOL market cap)
- ✅ Users already hold SOL
- ❌ Doesn't capture value for Air.Fun
- ❌ Dependent on Solana ecosystem

**Option C: Hybrid (SOL + AIR dual pools)**

- ✅ Best of both worlds
- ❌ Complex UX (which pool to trade?)
- ❌ Split liquidity

**Recommendation Needed:** Decide before implementing bonding curve contracts.

---

### 2. USDair Stablecoin Necessity

**Question:** Do we need our own stablecoin or just use USDC?

**Case for USDair:**

- x402 agent payment standard integration
- Platform fee capture (0.1% on USDair txs)
- DeFi ecosystem control (USDair lending, yield)

**Case for USDC:**

- Already trusted ($30B market cap)
- No regulatory overhead (Circle manages)
- Users already hold USDC

**Recommendation Needed:** Determine if x402 requires custom stablecoin or works with USDC.

---

### 3. LiveCoin (Temporary Stream Token)

**Question:** Is LiveCoin worth the complexity?

**Arguments For:**

- Adds excitement/volatility to streams
- Viewers influence stream outcome
- Gamification potential (bets, challenges)

**Arguments Against:**

- Confusing UX (users manage 2 tokens: Memecoin + LiveCoin)
- Technical complexity (temporary token lifecycle)
- Regulatory risk (gambling classification)

**Recommendation:** Launch MVP without LiveCoin, add in v2 if needed.

---

### 4. Famous Character Agents (IP Rights)

**Question:** How to handle famous characters (Mickey Mouse, Pikachu, etc.)?

**Current Plan:** Story Protocol licensing

**Challenges:**

- Disney/Nintendo won't license via Story Protocol
- Copyright infringement risk
- User-created derivatives may violate IP

**Options:**

1. **Ban famous characters** (safest, limits creativity)
2. **Allow with disclaimer** ("fan art, not official")
3. **Partner with IP holders** (unlikely for MVP)
4. **Story Protocol derivatives only** (streamer creates original, others derive)

**Recommendation Needed:** Define IP policy before launch.

---

### 5. MCP Server Selection

**Question:** Which MCP servers should agents connect to?

**Suggested Servers:**

- `stripe-mcp-server` - Payment processing
- `memory-mcp-server` - Agent persistent memory
- `brave-search-mcp-server` - Web search
- `github-mcp-server` - Code repositories (for dev streamers)
- `google-calendar-mcp-server` - Scheduling (for event streamers)

**Custom Air.Fun MCP Server:**

- Access to Air.Fun platform data
- Purchase history, viewer stats
- Memecoin prices, graduation status
- Stream analytics

**Recommendation Needed:** Define default MCP servers + allow streamer customization.

---

### 6. Agent Payment Budgets

**Question:** How do agents pay viewers without draining streamer wallet?

**Scenario:**

```
Streamer deploys agent
Agent offers game: "Answer trivia, win $50!"
100 viewers play, 10 win
Agent needs to pay 10 × $50 = $500
```

**Options:**

**A. Pre-Fund Agent Wallet:**

```
Streamer deposits $1000 to agent wallet on deployment
Agent spends from this budget
When empty, agent stops paying
```

**B. Real-Time Approval:**

```
Agent requests payment from streamer
Streamer approves each payment manually
Slow, but safer
```

**C. Smart Contract Escrow:**

```
Streamer locks funds in smart contract
Agent can withdraw up to limit per hour
Contract enforces budget
```

**Recommendation Needed:** Choose payment budget mechanism.

---

### 7. Viewer Control Paywall

**Question:** Should viewers pay to control agent movement?

**Scenario:**

```
Agent has movement.type = "viewer"
Viewer wants to move agent left
Should this cost money?
```

**Options:**

**A. Always Free:**

- ✅ More engagement
- ❌ Spam risk (trolls moving agent constantly)

**B. Always Paid ($1-5 per move):**

- ✅ Revenue for streamer
- ❌ Reduced engagement

**C. Streamer Choice:**

- Streamer sets price (or free)
- Default: $1 per move

**Recommendation:** Option C (streamer decides).

---

### 8. Ava Studio Integration (Story Buildathon)

**Question:** When to generate videos with Ava Studio?

**Current Plan:**

- Stream start: 15s promotional trailer
- Agent deployment: 10s agent reveal video
- Token graduation: 20s celebration video

**Questions:**

- Should videos be auto-generated or manual?
- Should videos be NFTs?
- Who pays for Ava Studio credits? (Streamer or platform?)

**Recommendation Needed:** Define Ava Studio workflow.

---

### 9. Multi-Stream Memecoin Reuse

**Question:** Can streamer reuse same memecoin across multiple streams?

**Scenario:**

```
Streamer creates PTRX memecoin on Stream #1
Stream #1 ends, PTRX market cap = $50k (not graduated)
Streamer starts Stream #2
Should Stream #2:
  A. Create new memecoin (PTRX2)
  B. Continue with PTRX from Stream #1
```

**Option A: New Memecoin Per Stream**

- ✅ Clear separation (1 stream = 1 token)
- ❌ Fragmented liquidity (PTRX, PTRX2, PTRX3...)

**Option B: Reuse Memecoin**

- ✅ Builds momentum (PTRX across all streams)
- ❌ Confusing (which stream is PTRX for?)

**Recommendation:** Streamer choice (checkbox: "Create new token" vs "Continue existing").

---

### 10. Platform Fees on Agent Interactions

**Question:** Should platform charge fees on non-purchase interactions?

**Examples:**

- Viewer tips agent: 2% platform fee?
- Viewer pays to move agent: 2% platform fee?
- Agent pays viewer (game reward): 2% platform fee?

**Arguments For:**

- Platform provides infrastructure
- Consistent fee model (all transactions)

**Arguments Against:**

- Reduces streamer earnings
- Complicates UX (fees on everything)

**Recommendation Needed:** Define fee policy for all interaction types.

---

## Implementation Roadmap

### Phase 1: MVP - Native Platform (Months 1-3)

**Goal:** Prove core concept with 50 beta streamers

**Features:**

- ✅ WebRTC livestreaming (Mediasoup SFU)
- ✅ Automatic memecoin creation (Hedera Token Service)
- ✅ Bonding curve purchases (quadratic formula)
- ✅ Screen-space AR agents (Three.js, face-tracking)
- ✅ Click-to-buy interaction (desktop/mobile)
- ✅ Real-time price updates (Socket.io)
- ✅ Streamer dashboard (earnings, viewer count)

**Not Included:**

- ❌ Meta Quest 3 support (add in Phase 2)
- ❌ Geospatial AR (add in Phase 2)
- ❌ Story Protocol (add in Phase 2)
- ❌ Filter mode (add in Phase 3)
- ❌ LiveCoin (add if needed)

**Success Metrics:**

- 50 streamers complete at least 1 stream
- 500 viewers interact with agents
- 100+ memecoin purchases ($10k total volume)
- 80%+ user retention (streamers come back)

---

### Phase 2: AR/VR + Story Protocol (Months 4-6)

**Goal:** Add immersive features and IP rights

**Features:**

- Meta Quest 3 WebXR support
- Hand tracking for agent interactions
- Geospatial AR (RTK-GPS for outdoor streams)
- Story Protocol IP registration
- Royalty Token issuance on graduation
- IPfi marketplace (fractional IP ownership)
- Ava Studio video generation

**Success Metrics:**

- 500 streamers, 5,000 viewers
- 50+ Quest 3 users actively using hand tracking
- 10+ tokens graduated to DEX
- 5+ agents licensed as derivatives

---

### Phase 3: Filter Mode + Scale (Months 7-12)

**Goal:** Reach mainstream platforms

**Features:**

- OBS plugin for streamers
- Browser extension for viewers
- Twitch/YouTube/Kick integration
- pump.fun/Zora filter mode
- Mobile apps (iOS/Android)
- Advanced analytics dashboard

**Success Metrics:**

- 5,000 streamers (mix of native + filter)
- 50,000 viewers
- $1M+ monthly trading volume
- Partnerships with crypto streaming platforms

---

### Phase 4: DeFi Ecosystem (Months 13-18)

**Goal:** USDair stablecoin and DeFi products

**Features:**

- USDair stablecoin issuance
- Agent-to-agent payment infrastructure
- USDair lending markets
- Liquidity mining (AIR rewards)
- Cross-chain bridges
- DAO governance

**Success Metrics:**

- 15,000 streamers
- 200,000 viewers
- $10M+ monthly volume
- $50M+ TVL in USDair DeFi

---

## Relationship to Kiro Development

### What is Kiro Building?

Based on `kiro/tasks.md`, Kiro is implementing:

**Completed (✅):**

- Authentication Service (wallet + email)
- Smart Contract infrastructure (bonding curve, token factory, liquidity pools)
- Token Factory Service (memecoin creation, graduation)
- Bonding Curve Service (price calculations, purchases, fees)
- Streaming Service (WebRTC, Mediasoup)
- AI Agent Service (deployment, click tracking, statistics)
- Real-Time Communication (Socket.io, chat, price updates)
- Smart Contract Service wrapper (Hedera + Base)
- API Gateway (Express routes)
- Frontend - Streamer Web App (React, Three.js)
- Frontend - Viewer Web App (stream discovery, AR agents, purchase UI)

**In Progress (⏳):**

- Caching and optimization (Redis, performance tests)

**Pending (❌):**

- Deployment and infrastructure (Docker, AWS)

---

### How Kiro Work Relates to Air.Fun

**Kiro is building the BASE PLATFORM that air.fun will use:**

```
Kiro's Scope (Technical Implementation):
  ├─ Bonding curve contracts ✅
  ├─ WebRTC streaming ✅
  ├─ Agent deployment ✅
  ├─ Memecoin creation ✅
  ├─ Real-time price updates ✅
  └─ Basic UI (streamer + viewer) ✅

Air.Fun's Scope (Product & Features):
  ├─ Filter mode (OBS plugin, browser extension)
  ├─ Story Protocol integration
  ├─ Ava Studio video generation
  ├─ Meta Quest 3 / WebXR support
  ├─ Anti-bot protection (gesture validation)
  ├─ Gamification (LiveCoin, challenges, bounties)
  ├─ Agent-to-agent payments (x402, USDair)
  ├─ MCP server integrations
  ├─ Geospatial AR (RTK-GPS)
  └─ IPfi marketplace
```

**Integration Plan:**

1. **Take Kiro's codebase** (when Phase 1 complete)
2. **Add air.fun features** on top:
   - Filter mode plugin
   - Story Protocol services
   - Ava Studio integration
   - WebXR / Quest 3 support
   - Advanced gamification
3. **Maintain Kiro as "core engine"**
   - Kiro = Technical foundation
   - Air.Fun = Product layer

---

### What Air.Fun Can Learn from Kiro

**✅ Already Implemented in Kiro (Use As-Is):**

1. **Bonding Curve Math:**

   - Quadratic formula: `price = k * sold^2`
   - Purchase cost integration
   - Slippage protection
   - Fee distribution (98/2 split)

2. **WebRTC Architecture:**

   - Mediasoup SFU (proven scalable)
   - Connection recovery (exponential backoff)
   - Transport management

3. **Agent Click Tracking:**

   - Click attribution to purchases
   - Conversion rate calculation
   - Statistics aggregation

4. **Real-Time Sync:**

   - Socket.io room-based broadcasting
   - Price update batching (100ms)
   - Chat message ordering

5. **Smart Contract Patterns:**
   - Token factory contracts
   - Liquidity pool creation
   - LP token burning

**🔧 Gaps to Fill (Air.Fun Must Build):**

1. **Filter Mode:**

   - OBS plugin
   - Browser extension
   - RTMP metadata embedding

2. **Story Protocol:**

   - IP Asset registration
   - Derivative licensing
   - Royalty Token issuance
   - IPfi marketplace

3. **Anti-Bot Protection:**

   - Gesture validation (hand tracking)
   - Spatial positioning verification
   - CAPTCHA-like challenges

4. **Advanced Gamification:**

   - LiveCoin mechanics
   - Bounty system
   - Agent battles
   - Viewer influence mechanics

5. **Agent Payments:**

   - x402 protocol integration
   - USDair stablecoin
   - Agent payment budgets
   - Bi-directional payments

6. **Geospatial AR:**

   - RTK-GPS anchoring
   - Niantic Lightship VPS
   - Privacy controls

7. **Meta Quest 3:**
   - WebXR Device API
   - Hand tracking
   - Passthrough mode
   - Spatial anchors

---

### Kiro Development Timeline (Estimated)

**Based on tasks.md progress:**

- **Phase 1 (Completed):** Tasks 1-14 ✅ (Core platform, ~12 weeks)
- **Phase 2 (In Progress):** Task 15 ⏳ (Optimization, ~2 weeks)
- **Phase 3 (Pending):** Tasks 16-17 ❌ (Deployment, ~2 weeks)

**Estimated Completion:** Mid-December 2025 (2 weeks from now)

**Air.Fun Integration Window:** December 15 - January 15, 2026

---

## Next Steps

### Immediate Actions Needed

1. **Resolve Open Questions:**

   - [ ] Decide: AIR vs SOL for liquidity pairs
   - [ ] Decide: USDair vs USDC for agent payments
   - [ ] Decide: Include LiveCoin in MVP or defer?
   - [ ] Define IP policy for famous character agents
   - [ ] Choose MCP servers for agent connections
   - [ ] Define agent payment budget mechanism
   - [ ] Set viewer control paywall policy
   - [ ] Plan Ava Studio integration workflow

2. **Coordinate with Kiro:**

   - [ ] Review Kiro's completed code (tasks 1-14)
   - [ ] Test Kiro's MVP locally
   - [ ] Identify integration points for air.fun features
   - [ ] Plan handoff timeline (mid-December)

3. **Prioritize Features for MVP:**

   - [ ] Finalize MVP feature list (native platform only)
   - [ ] Defer filter mode to Phase 3
   - [ ] Defer Story Protocol to Phase 2
   - [ ] Focus on core streaming + bonding curve + agents

4. **Technical Validation:**

   - [ ] Test WebRTC latency (<100ms)
   - [ ] Validate bonding curve math
   - [ ] Prototype screen-space AR agent rendering
   - [ ] Test anti-bot gesture validation (proof of concept)

5. **Market Research:**
   - [ ] Analyze pump.fun usage data (if available)
   - [ ] Identify target streamers (crypto-native creators)
   - [ ] Estimate TAM (total addressable market)
   - [ ] Define go-to-market strategy (Phase 1)

---

## Conclusion

Air.Fun represents a **paradigm shift in creator monetization** by combining:

1. **Economic Disruption:** 95%+ creator revenue (vs 50-70% traditional)
2. **Technical Innovation:** AR/VR agents, gesture-based interactions, anti-bot protection
3. **Web3 Primitives:** Bonding curves, IP rights (Story Protocol), fractional ownership
4. **Multi-Platform Strategy:** Native app + filter mode (reach existing audiences)

**The platform is ambitious but achievable:**

- Kiro has built 80% of core infrastructure
- Air.Fun adds product layer (filter, Story, AR/VR, gamification)
- MVP ready in 3 months, full platform in 12 months

**Critical Success Factors:**

1. **Solve cold start:** Filter mode lets streamers keep existing audiences
2. **Prove anti-bot protection:** Differentiator from pump.fun
3. **Bootstrap AIR liquidity:** Essential for graduated memecoins
4. **Win Story Buildathon:** Validates IP rights integration
5. **Meta Quest 3 adoption:** WebXR immersive experience

**This document serves as:**

- Complete technical specification
- Feature prioritization guide
- Open questions for decision-making
- Integration plan with Kiro development
- Roadmap for Gemini Deep Research analysis

---

**Ready for Gemini Deep Research Input:**

This comprehensive overview consolidates:

- Your original notes (stream features, questions, tokenomics)
- Cube Pay Livestream business model
- AR Agent technical architecture
- Kiro development progress
- Story Protocol integration plan

**Recommended Gemini Prompt:**

> "Analyze this Air.Fun comprehensive vision document. Identify:
>
> 1. Technical feasibility gaps (what's hardest to build?)
> 2. Market positioning opportunities (how to differentiate from pump.fun/Twitch?)
> 3. Tokenomics optimization (AIR vs SOL, USDair necessity)
> 4. Anti-bot protection validation (will gesture-based trading work?)
> 5. Go-to-market strategy (native vs filter mode first?)
> 6. MVP feature prioritization (what to cut for faster launch?)
> 7. Regulatory risks (stablecoin, securities, gambling)
> 8. Partnership opportunities (Hedera, Story Protocol, Meta, pump.fun)
>
> Provide detailed analysis with recommendations for each decision point marked as 'Recommendation Needed'."

---

**Document Status:** ✅ Complete, ready for review and Gemini Deep Research analysis.
