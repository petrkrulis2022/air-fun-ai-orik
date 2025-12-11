# air.fun - Tech Stack Overview

**Last Updated:** December 11, 2025

---

## 🎯 Overview

air.fun is built with modern web technologies, prioritizing real-time performance, Web3 integration, and cross-platform compatibility. The project consists of two products sharing common patterns.

---

## 📊 Tech Stack at a Glance

| Category         | Platform          | Filter Extension    | Filter Server  |
| ---------------- | ----------------- | ------------------- | -------------- |
| **Language**     | TypeScript 5.8    | TypeScript 5.8      | TypeScript 5.8 |
| **Runtime**      | Browser           | Chrome Extension    | Node.js        |
| **Build Tool**   | Vite 6.2          | Vite 6.2            | tsc            |
| **UI Framework** | React 18.3        | Vanilla TS + Canvas | N/A            |
| **Real-time**    | WebRTC + Supabase | WebSocket           | WebSocket (ws) |
| **3D/Graphics**  | Three.js + R3F    | HTML5 Canvas        | N/A            |

---

## 🎬 Platform Tech Stack

### Core Framework

| Package      | Version | Purpose                 |
| ------------ | ------- | ----------------------- |
| `react`      | 18.3.1  | UI framework            |
| `react-dom`  | 18.3.1  | React DOM renderer      |
| `typescript` | 5.8.2   | Type-safe JavaScript    |
| `vite`       | 6.2.0   | Build tool & dev server |

### 3D Rendering

| Package              | Version | Purpose                     |
| -------------------- | ------- | --------------------------- |
| `three`              | 0.164.1 | 3D graphics library         |
| `@react-three/fiber` | 8.16.6  | React renderer for Three.js |
| `@react-three/drei`  | 9.105.6 | Useful helpers for R3F      |

### Backend & Real-time

| Package                 | Version | Purpose                   |
| ----------------------- | ------- | ------------------------- |
| `@supabase/supabase-js` | 2.86.0  | Database, auth, real-time |

### Web3 / Blockchain

| Package    | Version | Purpose                        |
| ---------- | ------- | ------------------------------ |
| `thirdweb` | 5.114.0 | Wallet connection, multi-chain |

### UI Components

| Package        | Version | Purpose           |
| -------------- | ------- | ----------------- |
| `lucide-react` | 0.378.0 | Icon library      |
| Tailwind CSS   | (CDN)   | Utility-first CSS |

---

## 🔌 Filter Extension Tech Stack

### Core Framework

| Package      | Version | Purpose              |
| ------------ | ------- | -------------------- |
| `typescript` | 5.8.2   | Type-safe JavaScript |
| `vite`       | 6.2.0   | Build tool           |
| `react`      | 18.3.1  | Popup UI only        |
| `react-dom`  | 18.3.1  | Popup UI only        |

### Chrome Extension APIs

| Package         | Version | Purpose                           |
| --------------- | ------- | --------------------------------- |
| `@types/chrome` | 0.0.280 | Chrome extension type definitions |

### Extension Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Extension                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  Content Scripts │  │  Service Worker  │                 │
│  │  (main.ts)       │  │  (background)    │                 │
│  │                  │  │                  │                 │
│  │  • streamer.ts   │  │  • WebSocket     │                 │
│  │  • viewer.ts     │  │    proxy         │                 │
│  │  • platform-     │  │  • Message       │                 │
│  │    detect.ts     │  │    routing       │                 │
│  └────────┬─────────┘  └────────┬─────────┘                 │
│           │                      │                          │
│           └──────────────────────┘                          │
│                  chrome.runtime.sendMessage                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Graphics

- **HTML5 Canvas API** - For rendering agents on video overlay
- **2D Context** - Drawing agents with glow effects, emoji, labels
- **pointer-events: auto** - Enabling click interactions
- **z-index: 999999** - Above platform UI

---

## 🖥️ Filter Server Tech Stack

### Core Framework

| Package      | Version | Purpose                    |
| ------------ | ------- | -------------------------- |
| `typescript` | 5.8.2   | Type-safe JavaScript       |
| Node.js      | 18+     | JavaScript runtime         |
| `tsx`        | 4.19.0  | TypeScript execution (dev) |

### WebSocket

| Package | Version | Purpose                  |
| ------- | ------- | ------------------------ |
| `ws`    | 8.18.0  | WebSocket server library |

### Server Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Signaling Server                          │
│                    (Node.js + ws)                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │  HTTP Server     │  │  WebSocket Server                │ │
│  │                  │  │                                  │ │
│  │  • Health check  │  │  • Connection handling           │ │
│  │  • /health       │  │  • Message routing               │ │
│  │  • CORS headers  │  │  • PING/PONG keepalive          │ │
│  └──────────────────┘  │  • Stream state management       │ │
│                        │  • Viewer subscriptions          │ │
│                        └──────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  In-Memory State (TODO: migrate to Supabase)         │   │
│  │                                                       │   │
│  │  streams: Map<streamId, StreamState>                 │   │
│  │  socketToStream: Map<WebSocket, {streamId, role}>    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Data Storage Architecture

### Current State

| Component         | Storage   | Database   | Persistence        |
| ----------------- | --------- | ---------- | ------------------ |
| **Platform**      | Supabase  | PostgreSQL | ✅ Persistent      |
| **Filter Server** | In-Memory | None       | ❌ Lost on restart |

### Platform Database Schema

```sql
-- streams table (Supabase)
CREATE TABLE public.streams (
  id TEXT PRIMARY KEY,
  streamerId TEXT NOT NULL,
  streamerName TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  isLive BOOLEAN DEFAULT true,
  viewerCount INTEGER DEFAULT 0,
  coinSymbol TEXT NOT NULL,
  marketCap TEXT NOT NULL,
  ath TEXT NOT NULL,
  agents JSONB DEFAULT '[]'::jsonb,  -- AgentState[] embedded
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Filter Server (In-Memory)

```typescript
// Current: No persistence
const streams = new Map<string, StreamState>();

interface StreamState {
  streamId: string;
  agents: AirFunAgent[];
  streamerSocket: WebSocket | null;
  viewers: Set<WebSocket>;
  createdAt: number;
}
```

### 🔮 Recommended: Unified Agent Table

See `PROJECT_OVERVIEW.md` for the proposed unified `agents` table that supports both Platform and Filter with a `source` attribute.

---

## 🔗 Communication Protocols

### Platform: WebRTC + Supabase Signaling

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│ Streamer │         │ Supabase │         │  Viewer  │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     │  1. Create stream  │                    │
     │───────────────────>│                    │
     │                    │                    │
     │  2. SDP Offer      │                    │
     │───────────────────>│                    │
     │                    │  3. Subscribe      │
     │                    │<───────────────────│
     │                    │                    │
     │                    │  4. SDP Offer      │
     │                    │───────────────────>│
     │                    │                    │
     │                    │  5. SDP Answer     │
     │                    │<───────────────────│
     │  6. SDP Answer     │                    │
     │<───────────────────│                    │
     │                    │                    │
     │  7. ICE Candidates │                    │
     │<──────────────────>│<──────────────────>│
     │                    │                    │
     │  8. P2P Video Stream (direct)          │
     │<───────────────────────────────────────>│
```

### Filter: WebSocket Protocol

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│ Streamer │         │  Server  │         │  Viewer  │
│Extension │         │ (ws:3001)│         │Extension │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     │  REGISTER_STREAM   │                    │
     │  {agents: [...]}   │                    │
     │───────────────────>│                    │
     │                    │                    │
     │                    │  SUBSCRIBE_TO_STREAM
     │                    │<───────────────────│
     │                    │                    │
     │                    │  AGENT_STATE_UPDATE
     │                    │  {agents: [...]}   │
     │                    │───────────────────>│
     │                    │                    │
     │                    │  AGENT_INTERACTION │
     │                    │  {agentId, action} │
     │  Notification      │<───────────────────│
     │<───────────────────│                    │
     │                    │                    │
     │  PING ─────────────│───────────────────>│
     │  PONG <────────────│<───────────────────│
```

---

## 🌐 Supported Blockchains

| Chain            | Chain ID | Network | Purpose           |
| ---------------- | -------- | ------- | ----------------- |
| Ethereum Sepolia | 11155111 | Testnet | Primary testing   |
| Base Sepolia     | 84532    | Testnet | L2 testing        |
| Hedera Testnet   | 296      | Testnet | Alternative chain |

### Wallet Support

| Wallet          | ID                    | Priority    |
| --------------- | --------------------- | ----------- |
| MetaMask        | `io.metamask`         | Primary     |
| Coinbase Wallet | `com.coinbase.wallet` | Secondary   |
| Rainbow         | `me.rainbow`          | Alternative |
| Rabby           | `io.rabby`            | Alternative |

---

## 🛠️ Development Tools

### Build & Bundle

| Tool       | Purpose                        |
| ---------- | ------------------------------ |
| Vite       | Fast dev server, HMR, bundling |
| TypeScript | Type checking, compilation     |
| tsx        | TypeScript execution (dev)     |

### Chrome Extension

| Tool            | Purpose                           |
| --------------- | --------------------------------- |
| Manifest V3     | Modern extension format           |
| Content Scripts | DOM manipulation                  |
| Service Worker  | Background tasks, WebSocket proxy |

### Code Quality

| Tool                   | Purpose              |
| ---------------------- | -------------------- |
| TypeScript strict mode | Type safety          |
| ES Modules             | Modern module system |

---

## 📁 Build Outputs

### Platform

```
platform/
└── dist/               # Vite production build
    ├── index.html
    └── assets/
        ├── index-[hash].js
        └── index-[hash].css
```

### Filter Extension

```
filter/extension/
└── dist/               # Load as unpacked extension
    ├── manifest.json
    ├── service-worker.js
    ├── content.js
    ├── popup.html
    └── icons/
```

### Filter Server

```
filter/server/
└── dist/               # Compiled TypeScript
    ├── index.js
    └── types.js
```

---

## 🚀 Deployment Targets

| Component        | Target           | Notes                    |
| ---------------- | ---------------- | ------------------------ |
| Platform         | Vercel / Netlify | Static SPA hosting       |
| Filter Extension | Chrome Web Store | Manifest V3 required     |
| Filter Server    | Railway / Render | WebSocket support needed |

---

## 📊 Performance Considerations

### Platform

- **WebRTC**: P2P reduces server load
- **Three.js**: GPU-accelerated 3D
- **Supabase Real-time**: Efficient WebSocket subscriptions

### Filter Extension

- **Canvas rendering**: Hardware-accelerated 2D
- **Service Worker**: Non-blocking background processing
- **PING/PONG**: Keeps connections alive without re-establishing

### Filter Server

- **In-memory state**: Fast lookups (no database latency)
- **Lightweight**: Single WebSocket library dependency
- **Horizontal scaling**: Stateless design (add Redis for multi-instance)

---

## 🔒 Security Considerations

### Platform

- Wallet authentication (no passwords)
- Supabase Row Level Security (RLS)
- HTTPS required for WebRTC

### Filter Extension

- Content Security Policy (CSP)
- Minimal permissions in manifest
- Service Worker isolation

### Filter Server

- CORS headers for health check
- No sensitive data storage
- WebSocket origin validation (TODO)

---

## 📈 Future Tech Additions

| Technology               | Purpose                  | Status  |
| ------------------------ | ------------------------ | ------- |
| Meta Immersive Web SDK   | AR/VR on Quest 3         | Planned |
| @react-three/xr          | WebXR integration        | Planned |
| OpenAI API               | Voice Bot / Q&A Agent    | Planned |
| Stripe / Crypto payments | Payment Cube             | Planned |
| Redis                    | Multi-server state       | Planned |
| PostgreSQL               | Persistent agent configs | Planned |
