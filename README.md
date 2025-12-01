# air.fun MVP

Decentralized livestreaming platform combining real-time video broadcasting with pump.fun-style memecoin launches.

## Project Structure

This is a monorepo containing the following packages:

```
air-fun-mvp/
├── packages/
│   ├── frontend-streamer/    # Streamer web application (React + Vite)
│   ├── frontend-viewer/       # Viewer web application (React + Vite)
│   ├── backend/               # Backend services (Node.js + Express)
│   └── contracts/             # Smart contracts (Hardhat + Solidity)
├── .kiro/                     # Kiro spec files
└── package.json               # Root package.json for workspace
```

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Three.js for 3D AR agent rendering
- Socket.io client for real-time updates
- Ethers.js for blockchain interactions

### Backend
- Node.js with Express
- Socket.io for WebSocket connections
- Mediasoup for WebRTC streaming
- Supabase (PostgreSQL) for database
- Redis for caching
- Hedera SDK and Ethers.js for blockchain

### Smart Contracts
- Solidity 0.8.20
- Hardhat for development
- OpenZeppelin contracts
- Deployed on Hedera testnet and Base Sepolia

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL (via Supabase)
- Redis

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
# Copy environment templates
cp .env.example .env
cp packages/backend/.env.example packages/backend/.env
cp packages/contracts/.env.example packages/contracts/.env
cp packages/frontend-streamer/.env.example packages/frontend-streamer/.env
cp packages/frontend-viewer/.env.example packages/frontend-viewer/.env
```

4. Fill in your environment variables in each `.env` file

### Development

Run all packages in development mode:

```bash
npm run dev
```

Or run individual packages:

```bash
# Backend
cd packages/backend
npm run dev

# Streamer frontend
cd packages/frontend-streamer
npm run dev

# Viewer frontend
cd packages/frontend-viewer
npm run dev

# Smart contracts
cd packages/contracts
npm run compile
```

### Building

Build all packages:

```bash
npm run build
```

### Testing

Run tests for all packages:

```bash
npm test
```

### Linting and Formatting

```bash
# Lint
npm run lint

# Format
npm run format

# Check formatting
npm run format:check
```

## Smart Contract Deployment

### Deploy to Hedera Testnet

```bash
cd packages/contracts
npm run deploy:hedera
```

### Deploy to Base Sepolia

```bash
cd packages/contracts
npm run deploy:base
```

## Architecture

The platform consists of:

1. **Authentication Service**: Web3 wallet and email authentication
2. **Streaming Service**: WebRTC-based livestreaming
3. **Token Factory Service**: Automatic memecoin creation
4. **Bonding Curve Service**: Token pricing and purchase execution
5. **AI Agent Service**: 3D AR agent deployment and tracking
6. **Real-Time Communication**: WebSocket-based updates

## Key Features

- Automatic memecoin creation when stream starts
- Bonding curve pricing (price = k * supply²)
- AI agents as 3D AR buy buttons
- Token graduation at $69k market cap
- Dual-chain support (Hedera + Base)
- Real-time price updates
- 98% creator revenue share

## License

Private - All rights reserved
