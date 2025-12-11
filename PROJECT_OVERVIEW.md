# air.fun - Complete Project Overview

**Last Updated:** December 11, 2025  
**Status:** Working MVP with two products

---

## 🎯 Executive Summary

**air.fun** is a revolutionary live streaming ecosystem with interactive AI agents that viewers can interact with in real-time. The project consists of **two complementary products**:

1. **air.fun Platform** (`platform/`) - A standalone streaming platform with WebRTC, Web3 wallet integration, and 3D agents
2. **air.fun Filter** (`filter/`) - A Chrome extension that adds clickable AI agents to existing platforms (Twitch, YouTube, Kick)

Both products share the same vision: **placing interactive AI agents on live streams that viewers can click and interact with for payments, Q&A, predictions, and more.**

---

## 🏛️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         air.fun Ecosystem                                │
├─────────────────────────────────┬───────────────────────────────────────┤
│                                 │                                       │
│   🎬 air.fun Platform           │   🔌 air.fun Filter                   │
│   (platform/)                   │   (filter/)                           │
│                                 │                                       │
│   ┌─────────────────────┐       │   ┌─────────────────────┐             │
│   │  React + Vite App   │       │   │  Chrome Extension   │             │
│   │  - StreamerInterface│       │   │  - Content Scripts  │             │
│   │  - ViewerInterface  │       │   │  - Service Worker   │             │
│   │  - 3D Agents        │       │   │  - Canvas Overlay   │             │
│   └──────────┬──────────┘       │   └──────────┬──────────┘             │
│              │                  │              │                        │
│   ┌──────────▼──────────┐       │   ┌──────────▼──────────┐             │
│   │  WebRTC Service     │       │   │  WebSocket Client   │             │
│   │  (P2P Video)        │       │   │  (Agent Sync)       │             │
│   └──────────┬──────────┘       │   └──────────┬──────────┘             │
│              │                  │              │                        │
│   ┌──────────▼──────────┐       │   ┌──────────▼──────────┐             │
│   │  Supabase           │       │   │  Signaling Server   │             │
│   │  (Signaling + DB)   │       │   │  (Node.js + WS)     │             │
│   └─────────────────────┘       │   └─────────────────────┘             │
│                                 │                                       │
└─────────────────────────────────┴───────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
air-fun-ai/
├── platform/                    # 🎬 Native air.fun Streaming Platform
│   ├── App.tsx                  # Main app with wallet connection
│   ├── index.tsx                # Entry point
│   ├── types.ts                 # Platform types (UserRole, AgentState)
│   ├── components/
│   │   ├── StreamerInterface.tsx    # Streamer dashboard + camera
│   │   ├── ViewerInterface.tsx      # Viewer experience + agents
│   │   ├── StreamGallery.tsx        # Live stream discovery
│   │   ├── StreamSetup.tsx          # Stream configuration
│   │   ├── StreamCard.tsx           # Stream preview cards
│   │   ├── Agent3D.tsx              # 3D agent rendering
│   │   └── AuctionCard.tsx          # Agent bidding interface
│   ├── services/
│   │   ├── webRTCService.ts         # WebRTC P2P video streaming
│   │   ├── streamService.ts         # Stream CRUD + real-time
│   │   └── auctionService.ts        # Agent auction/bidding
│   ├── lib/
│   │   └── supabase.ts              # Supabase client config
│   └── public/
│       └── models/                  # 3D model assets
│
├── filter/                      # 🔌 Browser Extension for External Platforms
│   ├── extension/               # Chrome Manifest V3 Extension
│   │   ├── src/
│   │   │   ├── background/
│   │   │   │   └── service-worker.ts    # WebSocket proxy
│   │   │   ├── content/
│   │   │   │   ├── main.ts              # Entry, role detection
│   │   │   │   ├── streamer.ts          # Agent placement panel
│   │   │   │   └── viewer.ts            # Canvas overlay on video
│   │   │   ├── shared/
│   │   │   │   ├── types.ts             # Shared types
│   │   │   │   ├── ws-client.ts         # WebSocket wrapper
│   │   │   │   └── platform-detect.ts   # YouTube/Twitch/Kick detection
│   │   │   └── popup/
│   │   │       └── popup.ts             # Role switcher UI
│   │   ├── public/
│   │   │   └── manifest.json            # Extension manifest
│   │   └── dist/                        # Built extension (load in Chrome)
│   │
│   ├── server/                  # WebSocket Signaling Server
│   │   ├── src/
│   │   │   ├── index.ts                 # Server + message routing
│   │   │   └── types.ts                 # Shared message types
│   │   └── dist/                        # Built server
│   │
│   └── sdk/                     # @airfun/overlay-client SDK
│       └── src/
│           ├── index.ts
│           ├── streamer-client.ts
│           └── viewer-client.ts
│
├── shared/                      # 📦 Shared Types
│   └── types/
│       └── agent.ts             # Agent types, templates, WS messages
│
├── docs/                        # 📚 Documentation
│   ├── PROJECT_OVERVIEW.md      # This file
│   ├── CHROME_EXTENSION_DEVELOPMENT_SUMMARY.md
│   └── ...other docs
│
└── Copilot Summaries/           # 📝 Development History
    ├── DEVELOPMENT_SUMMARY.md
    ├── AGENT_SYNC_FIX.md
    ├── WEBRTC_TESTING_GUIDE.md
    └── ...
```

---

## 🎬 Product 1: air.fun Platform

### Overview

A full-featured, standalone streaming platform with Web3 wallet integration, WebRTC peer-to-peer video, and interactive 3D AI agents.

### Tech Stack

| Layer        | Technology                                     |
| ------------ | ---------------------------------------------- |
| Frontend     | React 18 + TypeScript + Vite                   |
| 3D Rendering | Three.js + @react-three/fiber                  |
| Styling      | Tailwind CSS                                   |
| Streaming    | WebRTC (peer-to-peer)                          |
| Backend      | Supabase (PostgreSQL + Real-time)              |
| Wallet       | Thirdweb SDK                                   |
| Chains       | Ethereum Sepolia, Base Sepolia, Hedera Testnet |

### Key Features

#### ✅ Implemented

- **Wallet Connection** - MetaMask, Coinbase Wallet, Rainbow, Rabby
- **Stream Creation** - Title, thumbnail, coin symbol configuration
- **WebRTC Streaming** - Live camera feed with ICE candidate queuing
- **Multi-viewer Support** - Multiple viewers can watch simultaneously
- **3D Agent Placement** - Place agents in 3D space
- **Real-time Sync** - Agents sync between streamer and viewers
- **Stream Gallery** - Discover live streams
- **Auction System** - Bid on agent placement slots

#### ⏳ Planned

- Meta Immersive Web SDK for AR/VR (Quest 3)
- Hand tracking for gesture-based interactions
- Spatial anchors for persistent agent placement
- Payment integration with crypto

### User Flows

#### Streamer Flow

```
1. Connect Wallet (MetaMask, etc.)
2. Click "Start Streaming"
3. Configure stream (title, thumbnail, coin)
4. Click "GO LIVE" → Camera permission
5. Add 3D agents using Agent Manager
6. Position agents in 3D space
7. Stream is live, viewers can join
```

#### Viewer Flow

```
1. Connect Wallet
2. Browse Stream Gallery
3. Click on a live stream
4. WebRTC connection established
5. See video feed + 3D agents
6. Interact with agents (bid, tip, etc.)
```

### Running the Platform

```bash
cd platform

# Install dependencies
npm install

# Create .env with Supabase credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Run (single instance)
npm run dev
# Opens on http://localhost:5173

# Run (multi-port testing)
PORT=5180 npm run dev  # Streamer
PORT=5181 npm run dev  # Viewer
```

---

## 🔌 Product 2: air.fun Filter

### Overview

A Chrome extension that adds clickable AI agents to existing streaming platforms (Twitch, YouTube, Kick). Streamers place agents, viewers see them overlaid on the video player.

### Tech Stack

| Layer         | Technology                   |
| ------------- | ---------------------------- |
| Extension     | Chrome Manifest V3           |
| Build         | Vite + TypeScript            |
| Communication | WebSocket via Service Worker |
| Overlay       | HTML5 Canvas                 |
| Server        | Node.js + ws library         |

### Key Features

#### ✅ Implemented

- **Streamer Mode** - Place agents via sidebar panel
- **Viewer Mode** - See clickable agents on video
- **Agent Templates** - Payment Cube, Voice Bot, Q&A Agent, Prediction Bot
- **Real-time Sync** - WebSocket-based agent synchronization
- **Keepalive** - PING/PONG to maintain connections
- **Platform Detection** - Twitch, YouTube, Kick support
- **Clickable Agents** - Canvas with pointer-events enabled

#### Agent Templates

| Template       | Emoji | Description                |
| -------------- | ----- | -------------------------- |
| Payment Cube   | 💰    | Accept tips and payments   |
| Voice Bot      | 🎤    | Voice interactions with AI |
| Q&A Agent      | ❓    | Answer viewer questions    |
| Prediction Bot | 🔮    | Prediction markets         |

### Architecture

```
┌─────────────────────┐     WebSocket      ┌─────────────────────┐
│  Chrome Extension   │ ◄──────────────────► │  Signaling Server  │
│  (Content Scripts)  │                      │  (ws://127.0.0.1:3001) │
└─────────────────────┘                      └─────────────────────┘
        │                                              │
        ├── Streamer Mode                              │
        │   • Sidebar panel on dashboard.twitch.tv    │
        │   • Agent template selection                │
        │   • Position sliders (X, Y)                 │
        │   • "GO LIVE WITH AGENTS" button            │
        │                                              │
        └── Viewer Mode                                │
            • Canvas overlay on twitch.tv video       │
            • Clickable agents (pointer-events: auto) │
            • Interaction modals                      │
            • z-index: 999999 (above Twitch UI)       │
```

### WebSocket Message Protocol

| Type                  | Direction       | Description                    |
| --------------------- | --------------- | ------------------------------ |
| `REGISTER_STREAM`     | Client → Server | Streamer goes live with agents |
| `SUBSCRIBE_TO_STREAM` | Client → Server | Viewer joins stream            |
| `AGENT_STATE_UPDATE`  | Both            | Sync agent positions           |
| `AGENT_INTERACTION`   | Client → Server | Viewer clicked agent           |
| `STREAM_ENDED`        | Server → Client | Stream ended notification      |
| `PING`                | Client → Server | Keepalive                      |
| `PONG`                | Server → Client | Keepalive response             |
| `WS_WAIT_READY`       | Internal        | Wait for WebSocket OPEN state  |

### Running the Filter

#### 1. Start the Signaling Server

```bash
cd filter/server
npm install
npm run build
node dist/index.js
# Server runs on ws://127.0.0.1:3001
# Health check: http://localhost:3001/health
```

#### 2. Build & Load the Extension

```bash
cd filter/extension
npm install
npm run build
```

In Chrome:

1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `filter/extension/dist` folder

#### 3. Test the Flow

**Streamer:**

1. Go to `dashboard.twitch.tv/u/YOUR_CHANNEL/stream-manager`
2. Select "Streamer" mode when prompted
3. Click agent template (e.g., Payment Cube)
4. Adjust position with sliders
5. Click "Place Agent"
6. Click "GO LIVE WITH AGENTS"

**Viewer:**

1. Open incognito window
2. Go to `twitch.tv/YOUR_CHANNEL`
3. Select "Viewer" mode when prompted
4. Agent should appear overlaid on video
5. Click agent to see interaction modal

---

## 📦 Shared Types & Data Architecture

### Current State (December 11, 2025)

**⚠️ Important:** Platform and Filter currently use **different agent type definitions** and **separate storage systems**.

#### Platform Agent Type (`platform/types.ts`)

```typescript
interface AgentState {
  id: string;
  name: string;
  type: "auction" | "prediction" | "voice";
  status: "IDLE" | "ACTIVE" | "CLAIMING" | "SESSION";
  position: [number, number, number]; // 3D coordinates
  minBid: number;
  currentHighestBid: Bid | null;
  endTime: number | null;
  walletAddress: string;
}
```

#### Filter Agent Type (`shared/types/agent.ts`)

```typescript
interface AirFunAgent {
  id: string;
  templateId: AgentTemplateId; // "payment" | "voice" | "qa" | "prediction"
  name: string;
  emoji: string;
  x: number; // 0-1 normalized (2D)
  y: number; // 0-1 normalized (2D)
  createdAt: number;
}
```

### Current Storage Architecture

| Component    | Storage                                    | Persistence        |
| ------------ | ------------------------------------------ | ------------------ |
| **Platform** | Supabase `streams` table (agents as JSONB) | ✅ Persistent      |
| **Filter**   | In-memory on Node.js server                | ❌ Lost on restart |

### 🔮 Recommended: Unified Agent Database

To share agents between Platform and Filter, we recommend a **single Supabase table** with a `source` attribute:

```sql
CREATE TABLE public.agents (
  id TEXT PRIMARY KEY,
  stream_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('platform', 'filter')),

  -- Common fields
  name TEXT NOT NULL,
  template_id TEXT NOT NULL,  -- 'payment', 'voice', 'qa', 'prediction', 'auction'
  emoji TEXT,
  status TEXT DEFAULT 'IDLE',
  wallet_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Position (unified)
  position_x FLOAT NOT NULL,  -- 0-1 normalized
  position_y FLOAT NOT NULL,  -- 0-1 normalized
  position_z FLOAT DEFAULT 0, -- 0 for 2D (filter), non-zero for 3D (platform)

  -- Platform-specific (nullable for filter)
  min_bid DECIMAL,
  current_bid JSONB,
  end_time TIMESTAMPTZ,

  -- Filter-specific (nullable for platform)
  external_platform TEXT,  -- 'TWITCH', 'YOUTUBE', 'KICK'
  external_stream_id TEXT, -- e.g., 'tw-username'

  FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE CASCADE
);

CREATE INDEX idx_agents_stream ON public.agents(stream_id);
CREATE INDEX idx_agents_source ON public.agents(source);
```

### Benefits of Unified Storage

1. **Cross-platform agents** - Create on Platform, use on Filter (or vice versa)
2. **Persistence** - Filter agents survive server restarts
3. **Analytics** - Single source of truth for all agent interactions
4. **Revenue tracking** - Unified payment/tipping records
5. **Story Protocol** - Single IP registration for agents regardless of source

---

## 🔑 Key Technical Decisions

### Platform: WebRTC via Supabase Signaling

- Uses Supabase real-time tables for SDP/ICE exchange
- Supports multiple viewers with ICE candidate queuing
- Falls back gracefully if audio fails (video-only mode)

### Filter: WebSocket via Service Worker

- Chrome extensions can't use WebSocket from content scripts (HTTPS mixed content)
- Service worker acts as WebSocket proxy
- Keepalive PING/PONG prevents service worker from going inactive

### Filter: Canvas Overlay

- Agents rendered on HTML5 canvas over video element
- `pointer-events: auto` makes agents clickable
- `z-index: 999999` ensures overlay is above platform UI

---

## 🚀 Current Status

### Platform

| Feature             | Status     |
| ------------------- | ---------- |
| Wallet connection   | ✅ Working |
| Stream creation     | ✅ Working |
| WebRTC streaming    | ✅ Working |
| Agent placement     | ✅ Working |
| Real-time sync      | ✅ Working |
| Stream gallery      | ✅ Working |
| AR/VR (Quest 3)     | ⏳ Planned |
| Payment integration | ⏳ Planned |

### Filter

| Feature                  | Status              |
| ------------------------ | ------------------- |
| Streamer agent placement | ✅ Working          |
| Viewer overlay           | ✅ Working          |
| Clickable agents         | ✅ Working          |
| Real-time sync           | ✅ Working          |
| Twitch support           | ✅ Working          |
| YouTube support          | ⏳ Needs testing    |
| Kick support             | ⏳ Needs testing    |
| Production server        | ⏳ Needs deployment |
| Payment integration      | ⏳ Planned          |

---

## 📋 Roadmap

### Phase 1: MVP ✅ COMPLETE

- [x] WebRTC streaming (platform)
- [x] Agent placement & sync (both)
- [x] Chrome extension with canvas overlay (filter)
- [x] Clickable agents (filter)

### Phase 2: Polish 🔄 IN PROGRESS

- [ ] Deploy signaling server to Railway (filter)
- [ ] Test YouTube & Kick support (filter)
- [ ] OBS Browser Source alternative (filter)
- [ ] Persist agent configurations (both)

### Phase 3: Monetization

- [ ] Payment Cube → actual crypto payments
- [ ] Tip integration with wallet
- [ ] Revenue sharing for agents
- [ ] Analytics dashboard

### Phase 4: AI Features

- [ ] Voice Bot with AI voice interaction
- [ ] Q&A Agent with LLM responses
- [ ] Prediction Bot with betting markets

### Phase 5: AR/VR

- [ ] Meta Immersive Web SDK integration
- [ ] Quest 3 hand tracking
- [ ] Spatial anchors for agents
- [ ] WebXR passthrough mode

---

## 🛠️ Development Commands

```bash
# Platform
cd platform
npm install
npm run dev              # Start dev server
npm run build            # Production build

# Filter Extension
cd filter/extension
npm install
npm run build            # Build to dist/
npm run dev              # Watch mode

# Filter Server
cd filter/server
npm install
npm run build            # Compile TypeScript
node dist/index.js       # Start server
```

---

## 🔗 Resources

- **Supabase Dashboard:** Configure database & real-time
- **Chrome Extensions:** `chrome://extensions` (Developer mode)
- **WebRTC Testing:** Use two browser windows or ports

---

## 👥 Team

This project is developed for the **Meta Horizon Start Developer Competition** (Deadline: December 9, 2025).

---

## 📝 Change Log

| Date         | Changes                                                    |
| ------------ | ---------------------------------------------------------- |
| Dec 11, 2025 | Added unified agent database architecture proposal         |
| Dec 11, 2025 | Documented current state of Platform vs Filter agent types |
| Dec 10, 2025 | Created comprehensive project overview                     |
| Dec 9, 2025  | Fixed clickable agents in filter extension                 |
| Dec 9, 2025  | Fixed WebSocket connection stability                       |
| Earlier      | WebRTC streaming, agent sync, wallet integration           |
