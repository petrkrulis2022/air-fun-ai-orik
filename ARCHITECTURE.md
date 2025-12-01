# air.fun MVP Architecture

## Project Structure

```
air-fun-mvp/
├── .kiro/                          # Kiro specification files
│   └── specs/
│       └── air-fun-mvp/
│           ├── requirements.md     # Feature requirements
│           ├── design.md           # Design document
│           └── tasks.md            # Implementation tasks
│
├── packages/                       # Monorepo packages
│   ├── backend/                    # Backend services
│   │   ├── src/
│   │   │   ├── index.ts           # Entry point
│   │   │   ├── services/          # Business logic services
│   │   │   ├── routes/            # API routes
│   │   │   ├── middleware/        # Express middleware
│   │   │   ├── models/            # Data models
│   │   │   └── utils/             # Utility functions
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   ├── frontend-streamer/          # Streamer web app
│   │   ├── src/
│   │   │   ├── main.tsx           # Entry point
│   │   │   ├── App.tsx            # Root component
│   │   │   ├── components/        # React components
│   │   │   ├── pages/             # Page components
│   │   │   ├── hooks/             # Custom React hooks
│   │   │   ├── store/             # State management
│   │   │   └── utils/             # Utility functions
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── tailwind.config.js
│   │
│   ├── frontend-viewer/            # Viewer web app
│   │   ├── src/
│   │   │   ├── main.tsx           # Entry point
│   │   │   ├── App.tsx            # Root component
│   │   │   ├── components/        # React components
│   │   │   ├── pages/             # Page components
│   │   │   ├── hooks/             # Custom React hooks
│   │   │   ├── store/             # State management
│   │   │   └── utils/             # Utility functions
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── tailwind.config.js
│   │
│   └── contracts/                  # Smart contracts
│       ├── contracts/              # Solidity contracts
│       │   ├── AIRToken.sol       # Platform token
│       │   ├── BondingCurve.sol   # Bonding curve logic
│       │   ├── MemecoinFactory.sol # Token factory
│       │   └── LiquidityPool.sol  # LP factory
│       ├── scripts/                # Deployment scripts
│       ├── test/                   # Contract tests
│       ├── hardhat.config.ts
│       └── package.json
│
├── .env.example                    # Environment template
├── .eslintrc.json                  # ESLint configuration
├── .prettierrc.json                # Prettier configuration
├── .gitignore                      # Git ignore rules
├── docker-compose.yml              # Local development services
├── package.json                    # Root package.json
├── tsconfig.json                   # Root TypeScript config
├── README.md                       # Project overview
├── SETUP.md                        # Setup instructions
└── ARCHITECTURE.md                 # This file

```

## Technology Stack

### Frontend Applications
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **3D Rendering**: Three.js with @react-three/fiber
- **State Management**: Zustand
- **Routing**: React Router
- **Real-time**: Socket.io client
- **Blockchain**: Ethers.js
- **Charts**: Recharts

### Backend Services
- **Runtime**: Node.js 18+
- **Framework**: Express
- **WebSocket**: Socket.io
- **Media Server**: Mediasoup (WebRTC)
- **Database**: Supabase (PostgreSQL)
- **Cache**: Redis
- **Authentication**: JWT + bcrypt
- **Blockchain**: Hedera SDK, Ethers.js
- **Storage**: AWS S3

### Smart Contracts
- **Language**: Solidity 0.8.20
- **Framework**: Hardhat
- **Libraries**: OpenZeppelin
- **Networks**: Hedera testnet, Base Sepolia
- **Testing**: Hardhat + fast-check (PBT)

## Service Architecture

### 1. Authentication Service
- Web3 wallet authentication (MetaMask, Hashio)
- Email/password authentication
- JWT token management
- Multi-wallet support

### 2. Streaming Service
- WebRTC connection management
- Stream lifecycle (start/stop)
- Video quality adaptation
- Stream discovery and search

### 3. Token Factory Service
- Automatic memecoin creation
- Dual-chain deployment (Hedera + Base)
- Symbol generation and collision handling
- Token metadata management

### 4. Bonding Curve Service
- Price calculation (price = k * supply²)
- Purchase execution
- Fee distribution (98% creator, 2% platform)
- Graduation logic ($69k threshold)

### 5. AI Agent Service
- Agent template management
- 3D agent deployment
- Click tracking and attribution
- Performance analytics

### 6. Real-Time Communication Service
- WebSocket connection management
- Chat message broadcasting
- Price update broadcasting
- Purchase notifications

### 7. Smart Contract Service
- Contract deployment
- Transaction execution
- Event monitoring
- Multi-chain routing

## Data Flow

### Token Purchase Flow
1. Viewer clicks AI agent in stream
2. Frontend requests price quote from backend
3. Backend calculates price using bonding curve
4. Viewer approves transaction in wallet
5. Backend executes purchase on blockchain
6. Smart contract locks USDC, mints tokens
7. Backend updates token state in database
8. Backend broadcasts price update via WebSocket
9. All viewers see updated bonding curve

### Stream Creation Flow
1. Streamer starts stream with configuration
2. Backend creates WebRTC producer transport
3. Backend triggers token factory service
4. Token factory deploys memecoin on both chains
5. Backend stores stream and token records
6. Backend generates and uploads thumbnail to S3
7. Stream appears in discovery feed

## Security Considerations

- **Authentication**: EIP-191 wallet signatures, JWT tokens
- **Rate Limiting**: 100 req/min per user, 10 auth attempts per IP
- **Input Validation**: All inputs sanitized
- **Smart Contracts**: Reentrancy guards, access controls
- **Encryption**: TLS 1.3 for all connections
- **Key Management**: AWS Secrets Manager

## Deployment Architecture

### Development
- Local PostgreSQL/Redis via Docker Compose
- Local development servers (Vite, tsx)
- Testnet deployments (Hedera, Base Sepolia)

### Production (Future)
- **Application Tier**: EC2 instances with auto-scaling
- **Media Tier**: Dedicated WebRTC servers
- **Database**: RDS PostgreSQL (Multi-AZ)
- **Cache**: ElastiCache Redis
- **Storage**: S3 + CloudFront CDN
- **Monitoring**: CloudWatch, Prometheus, Grafana

## Testing Strategy

### Unit Tests
- Service layer: 80% coverage
- Smart contracts: 100% coverage
- Utility functions: 90% coverage

### Property-Based Tests
- Bonding curve monotonicity
- Fee distribution correctness
- Token supply conservation
- Price quote accuracy
- Purchase atomicity

### Integration Tests
- API endpoint testing
- Service interaction testing
- Multi-chain deployment testing

### E2E Tests
- Full user workflows
- Stream lifecycle
- Token purchase flow

## Development Workflow

1. **Feature Development**: Follow tasks in `.kiro/specs/air-fun-mvp/tasks.md`
2. **Code Quality**: Run linting and formatting before commits
3. **Testing**: Write tests alongside implementation
4. **Review**: Ensure all requirements are met
5. **Deploy**: Deploy to testnets for validation

## Key Design Decisions

1. **Monorepo Structure**: Simplifies dependency management and code sharing
2. **Dual-Chain Deployment**: Hedera + Base for redundancy and reach
3. **Bonding Curve Pricing**: Automatic price discovery, no auction complexity
4. **WebRTC with Mediasoup**: Low-latency streaming without SFU complexity
5. **Property-Based Testing**: Validates universal correctness properties
6. **98/2 Fee Split**: Maximizes creator revenue while sustaining platform

## Future Enhancements

- Mobile native apps (iOS, Android)
- Advanced AI agent customization
- NFT-gated streams
- Video recording and VOD
- Cross-chain bridging
- Governance token
