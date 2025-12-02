# Implementation Plan

- [x] 1. Set up project structure and development environment
  - Create monorepo structure with frontend, backend, and smart contract workspaces
  - Configure TypeScript, ESLint, and Prettier
  - Set up package.json with dependencies (React, Express, Socket.io, Hardhat, Hedera SDK, ethers.js)
  - Initialize Git repository with .gitignore
  - Create environment variable templates (.env.example)
  - _Requirements: All_

- [x] 2. Implement Authentication Service
  - _Requirements: 1, 2, 20_

- [x] 2.1 Create authentication data models and database schema
  - Define User, WalletAddress, and AuthSession TypeScript interfaces
  - Create PostgreSQL schema with users, wallet_addresses, and sessions tables
  - Set up Supabase client configuration
  - _Requirements: 1.2, 2.1_

- [x] 2.2 Implement Web3 wallet authentication
  - Create wallet signature verification using EIP-191 standard
  - Implement connectWallet endpoint with MetaMask and Hashio support
  - Generate JWT tokens with 1-hour expiration
  - Implement session invalidation on wallet disconnect
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 2.3 Write property test for wallet authentication
  - **Property 5: Authentication Session Validity**
  - **Validates: Requirements 1.2, 2.3**

- [x] 2.4 Implement email authentication
  - Create registerEmail and loginEmail endpoints
  - Hash passwords using bcrypt
  - Generate JWT access and refresh tokens
  - Implement token refresh logic
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2.5 Implement multi-wallet support
  - Create linkWallet endpoint to associate multiple addresses
  - Implement getWalletBalances to query balances across chains
  - _Requirements: 1.3_

- [ ] 2.6 Write unit tests for authentication service
  - Test wallet signature verification
  - Test JWT token generation and validation
  - Test password hashing and comparison
  - Test rate limiting (10 attempts per IP per minute)
  - _Requirements: 1, 2, 20.2_

- [ ] 3. Implement Smart Contract infrastructure

- [ ] 3. Implement Smart Contract infrastructure
  - _Requirements: 5, 8, 9, 10, 12, 23_

- [x] 3.1 Deploy AIR platform token contracts
  - Write ERC-20 AIR token contract for Base Sepolia
  - Write HTS AIR token contract for Hedera testnet
  - Deploy contracts to both chains
  - Store contract addresses in environment variables
  - _Requirements: 12.2_

- [x] 3.2 Implement bonding curve smart contracts
  - Write bonding curve contract with quadratic pricing formula (price = k \* sold²)
  - Implement purchase function with slippage protection
  - Implement fee distribution (98% creator, 2% platform)
  - Add reentrancy guards and access controls
  - Deploy to Hedera and Base testnets
  - _Requirements: 8, 9, 10_

- [x] 3.3 Write property test for bonding curve pricing
  - **Property 1: Bonding Curve Price Monotonicity**
  - **Validates: Requirements 8.4**

- [x] 3.4 Write property test for fee distribution
  - **Property 2: Fee Distribution Correctness**
  - **Validates: Requirements 10.1, 10.2, 10.3**
-

- [x] 3.5 Implement memecoin factory contracts
  - Write factory contract to deploy new memecoins
  - Implement token creation with 1 billion supply
  - Set bonding curve parameters (k = 0.000000001)
  - Deploy factory to both chains
  - _Requirements: 5.2, 5.3, 5.4_

- [x] 3.6 Write property test for token supply conservation
  - **Property 3: Token Supply Conservation**
  - **Validates: Requirements 5.3**

- [x] 3.7 Implement liquidity pool factory contracts
  - Write factory contract to create MEMECOIN/AIR pools
  - Implement LP token burning mechanism
  - Add graduation threshold check ($69k market cap)
  - Deploy to both chains
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 3.8 Write property test for graduation threshold
  - **Property 4: Graduation Threshold Consistency**
  - **Validates: Requirements 12.1**

- [x] 3.9 Write unit tests for smart contracts
  - Test token deployment and initialization
  - Test purchase execution and token transfer
  - Test fee calculation and distribution
  - Test graduation and LP creation
  - Test access controls and security
  - _Requirements: 5, 8, 9, 10, 12_

- [x] 4. Implement Token Factory Service
  - _Requirements: 5, 23_

- [x] 4.1 Create token data models and database schema
  - Define Memecoin, BondingCurveState, and LiquidityPool interfaces
  - Create PostgreSQL schema for memecoins, bonding_curve_states, and liquidity_pools tables
  - _Requirements: 5_

- [x] 4.2 Implement automatic memecoin creation
  - Create createMemecoin function triggered on stream start
  - Generate unique token symbol (3-5 characters) from streamer name
  - Handle symbol collisions with numeric suffix
  - Deploy token contracts to Hedera and Base
  - Initialize bonding curve state in database and Redis
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4.3 Implement token metadata management
  - Create updateTokenMetadata endpoint
  - Support logo URL, description, and social links
  - Store metadata in database
  - _Requirements: 5_

- [x] 4.4 Implement token graduation logic
  - Create checkGraduationEligibility function
  - Implement graduateToken function to create liquidity pools
  - Burn LP tokens for rug-pull protection
  - Update token status to graduated
  - _Requirements: 12.1, 12.2, 12.3, 12.5_

- [x] 4.5 Write unit tests for token factory
  - Test symbol generation and collision handling
  - Test dual-chain deployment
  - Test graduation eligibility checks
  - Test metadata updates
  - _Requirements: 5, 12, 23_

- [x] 5. Implement Bonding Curve Service
  - _Requirements: 8, 9, 10, 11_

- [x] 5.1 Implement price calculation functions
  - Create calculatePrice function using formula: price = k \* sold²
  - Implement calculatePurchaseCost by integrating bonding curve
  - Create getPriceQuote with price impact and slippage calculations
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 5.2 Write property test for price monotonicity
  - **Property 1: Bonding Curve Price Monotonicity**
  - **Validates: Requirements 8.4**

- [x] 5.3 Implement purchase validation
  - Create validatePurchase function checking minimum amount ($1)
  - Verify wallet balance sufficiency
  - Check token graduation status
  - _Requirements: 9.1, 9.2, 12.5_

- [x] 5.4 Implement purchase execution
  - Create executePurchase function
  - Call smart contract to lock USDC and mint tokens
  - Update tokensSold and recalculate price
  - Handle slippage protection
  - Return transaction hash
  - _Requirements: 9.3, 9.4, 9.5, 9.6_

- [x] 5.5 Write property test for purchase atomicity
  - **Property 13: Purchase Transaction Atomicity**
  - **Validates: Requirements 9**

- [x] 5.6 Implement fee distribution
  - Create distributeFees function
  - Calculate 98% creator fee and 2% platform fee
  - Transfer fees to respective wallet addresses
  - Verify fee sum equals 100%
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 5.7 Write property test for fee distribution
  - **Property 2: Fee Distribution Correctness**
  - **Validates: Requirements 10.1, 10.2, 10.3**

- [x] 5.8 Implement liquidity depth tracking
  - Create getLiquidityDepth function
  - Calculate graduation progress percentage
  - Cache results in Redis
  - _Requirements: 12.1_

- [x] 5.9 Write unit tests for bonding curve service
  - Test price calculations with various supplies
  - Test purchase cost integration
  - Test slippage calculations
  - Test fee distribution math
  - _Requirements: 8, 9, 10_

- [x] 6. Implement Streaming Service
  - _Requirements: 3, 4, 15_

- [x] 6.1 Create stream data models and database schema
  - Define Stream, StreamRecord, and StreamSummary interfaces
  - Create PostgreSQL schema for streams table
  - _Requirements: 3_

- [x] 6.2 Set up WebRTC media server
  - Install and configure Mediasoup
  - Create media server worker processes
  - Configure routers for audio/video
  - _Requirements: 3.1, 4.3_

- [x] 6.3 Implement stream lifecycle management
  - Create startStream endpoint
  - Trigger automatic memecoin creation on stream start
  - Create WebRTC producer transport
  - Generate and upload thumbnail to S3
  - Implement endStream endpoint with summary generation
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 6.4 Write property test for stream lifecycle
  - **Property 12: Stream Lifecycle State Machine**
  - **Validates: Requirements 3.1, 3.3**

- [x] 6.5 Implement WebRTC transport management
  - Create createProducerTransport endpoint
  - Create createConsumerTransport endpoint
  - Implement connectTransport for DTLS parameters
  - Implement produceMedia for audio/video tracks
  - Implement consumeMedia for viewer connections
  - _Requirements: 3.1, 4.3, 15.3, 15.4_

- [x] 6.6 Write property test for WebRTC connection idempotency
  - **Property 6: WebRTC Connection Idempotency**
  - **Validates: Requirements 4.3, 15**

- [x] 6.7 Implement stream discovery
  - Create listActiveStreams endpoint with filters
  - Implement searchStreams with query matching
  - Create getHotStreams ordered by viewers and market cap
  - _Requirements: 4.1, 4.2, 4.4_

- [x] 6.8 Implement WebRTC connection recovery
  - Add exponential backoff reconnection (1s, 2s, 4s, 8s, 15s)
  - Implement 30-second timeout with user notification
  - _Requirements: 15.1, 15.2_

- [x] 6.9 Write unit tests for streaming service
  - Test stream creation and lifecycle
  - Test WebRTC transport creation
  - Test stream discovery and filtering
  - Test connection recovery logic
  - _Requirements: 3, 4, 15_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement AI Agent Service
  - _Requirements: 6, 7, 19_

- [x] 8.1 Create agent data models and database schema
  - Define AgentTemplate, AgentConfig, DeployedAgent, and AgentStats interfaces
  - Create PostgreSQL schema for agent_templates, agents, and agent_deployments tables
  - _Requirements: 6, 7_

- [x] 8.2 Create pre-built agent templates
  - Create 4 agent templates (buy_button, challenge_giver, predictor, leaderboard)
  - Define 3D model URLs and default colors for each template
  - Seed templates into database
  - _Requirements: 7.1, 7.2_

- [x] 8.3 Implement agent deployment
  - Create deployAgent endpoint with 3D position coordinates
  - Broadcast agent visibility to all stream viewers
  - Implement updateAgentPosition with real-time updates
  - Create removeAgent endpoint
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 8.4 Implement agent click tracking
  - Create trackAgentClick endpoint

  - Increment click count in database
  - _Requirements: 6.5, 19.1_

- [x] 8.5 Implement purchase attribution
  - Create recordPurchase function
  - Link purchases to agent deployments
  - Update agent statistics (purchases, volume)
  - _Requirements: 6.5, 19.2_

- [x] 8.6 Write property test for agent click attribution
  - **Property 8: Agent Click Attribution**
  - **Validates: Requirements 6.5**

- [x] 8.7 Implement agent statistics
  - Create getAgentStats endpoint
  - Calculate conversion rate (purchases / clicks)
  - Calculate average purchase size
  - _Requirements: 19.3, 19.4_

- [x] 8.8 Write unit tests for AI agent service
  - Test agent template retrieval
  - Test agent deployment and positioning
  - Test click tracking
  - Test purchase attribution
  - Test statistics calculations
  - _Requirements: 6, 7, 19_

- [-] 9. Implement Real-Time Communication Service
  - _Requirements: 11, 13, 14, 16_

- [x] 9.1 Set up Socket.io server
  - Install and configure Socket.io
  - Create WebSocket server with connection handling

  - Implement room-based broadcasting
  - _Requirements: 11, 13, 14_

- [x] 9.2 Implement connection management
  - Create handleConnection with user authentication
  - Implement handleDisconnection cleanup
  - Create joinStreamRoom and leaveStreamRoom
  - _Requirements: 16_

- [x] 9.3 Implement chat message broadcasting
  - Create broadcastChatMessage function
  - Parse @mentions in messages
  - Deliver messages within 1 second
  - _Requirements: 13.1, 13.2, 13.4_

- [x] 9.4 Write property test for chat message ordering
  - **Property 9: Chat Message Ordering**
  - **Validates: Requirements 13.1, 13.2**

- [x] 9.5 Implement price update broadcasting
  - Create broadcastPriceUpdate function
  - Include current price, next price, market cap, graduation progress
  - Deliver updates within 500ms
  - Broadcast on every purchase
  - _Requirements: 11.1, 11.2, 11.4, 11.5_

- [x] 9.6 Write property test for price update freshness
  - **Property 14: Real-time Price Update Freshness**
  - **Validates: Requirements 11.1, 11.5**

- [x] 9.7 Implement purchase notifications
  - Create broadcastPurchaseNotification function
  - Include buyer info, amount, price, new market cap
  - Highlight large purchases (>$100)
  - Deliver within 1 second
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [x] 9.8 Implement graduation announcements
  - Create broadcastGraduationAnnouncement function
  - Include token symbol, final market cap, LP address
  - _Requirements: 12.4_

- [x] 9.9 Implement WebSocket recovery
  - Add automatic reconnection with Socket.io
  - Implement event replay from last event ID
  - _Requirements: 16.1, 16.2, 16.3, 16.4_

- [x] 9.10 Write unit tests for real-time service
  - Test connection and room management
  - Test message broadcasting
  - Test price update delivery
  - Test event replay logic
  - _Requirements: 11, 13, 14, 16_

- [x] 10. Implement Smart Contract Service wrapper
  - _Requirements: 9, 10, 17, 23_

- [x] 10.1 Create blockchain client configuration
  - Set up Hedera SDK client for testnet
  - Set up ethers.js provider for Base Sepolia
  - Load contract ABIs and addresses
  - _Requirements: 23_

- [x] 10.2 Implement token deployment functions
  - Create deployMemecoin wrapper for both chains
  - Handle transaction signing and submission
  - Return contract addresses
  - _Requirements: 5.2, 23.1, 23.2_

- [x] 10.3 Implement purchase execution wrapper
  - Create executeBondingCurvePurchase function
  - Route to correct chain based on user preference
  - Handle USDC approval and transfer
  - Return transaction hash
  - _Requirements: 9.3, 9.5, 23.3_

- [x] 10.4 Implement liquidity pool creation wrapper
  - Create createLiquidityPool function
  - Call factory contract on both chains
  - Burn LP tokens
  - _Requirements: 12.2, 12.3, 23.5_

- [x] 10.5 Implement fee transfer functions
  - Create transferCreatorFees function
  - Create transferPlatformFees function
  - Handle multi-chain transfers
  - _Requirements: 10.4, 10.5_

- [x] 10.6 Implement transaction monitoring
  - Create waitForConfirmation function
  - Poll transaction status every 5 seconds
  - Timeout after 60 seconds
  - Implement getTransactionStatus
  - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [x] 10.7 Implement contract event subscriptions
  - Create subscribeToContractEvents function
  - Listen for TokenPurchased, TokenGraduated, LiquidityPoolCreated events
  - Trigger appropriate service actions on events
  - _Requirements: 11, 12, 14_

- [x] 10.8 Write unit tests for smart contract service
  - Test transaction submission and monitoring
  - Test event subscription and handling
  - Test multi-chain routing
  - _Requirements: 9, 10, 17, 23_

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement API Gateway and routing
  - _Requirements: All_

- [x] 12.1 Set up Express server
  - Create Express app with middleware (CORS, body-parser, helmet)
  - Configure rate limiting (100 req/min per user, 10 auth attempts per IP)
  - Set up error handling middleware
  - _Requirements: 20.1, 20.2_

- [x] 12.2 Create authentication routes
  - POST /auth/wallet/connect - Web3 wallet authentication
  - POST /auth/email/register - Email registration
  - POST /auth/email/login - Email login
  - POST /auth/refresh - Token refresh
  - POST /auth/wallet/link - Link additional wallet
  - GET /auth/wallets/balances - Get wallet balances
  - _Requirements: 1, 2_

- [x] 12.3 Create streaming routes
  - POST /streams/start - Start stream
  - POST /streams/:id/end - End stream
  - GET /streams/active - List active streams
  - GET /streams/search - Search streams
  - GET /streams/hot - Get hot streams
  - GET /streams/:id/status - Get stream status
  - _Requirements: 3, 4_

- [x] 12.4 Create token routes
  - GET /tokens/:id - Get token details
  - GET /tokens/stream/:streamId - Get token by stream
  - PUT /tokens/:id/metadata - Update token metadata
  - POST /tokens/:id/graduate - Trigger graduation
  - GET /tokens/:id/eligibility - Check graduation eligibility
  - _Requirements: 5, 12_

- [x] 12.5 Create purchase routes
  - POST /purchases/quote - Get price quote
  - POST /purchases/execute - Execute purchase
  - GET /purchases/:id - Get purchase details
  - GET /purchases/user/:userId - Get user purchase history
  - _Requirements: 8, 9_

- [x] 12.6 Create agent routes
  - GET /agents/templates - List agent templates
  - GET /agents/templates/:id - Get template details
  - POST /agents/deploy - Deploy agent
  - PUT /agents/:id/position - Update agent position
  - DELETE /agents/:id - Remove agent
  - POST /agents/:id/click - Track agent click
  - GET /agents/:id/stats - Get agent statistics
  - _Requirements: 6, 7, 19_

- [x] 12.7 Create analytics routes
  - GET /analytics/streamer/:id - Get streamer dashboard
  - GET /analytics/streams/:id - Get stream analytics
  - GET /analytics/tokens/:id - Get token performance
  - _Requirements: 18_

- [x] 12.8 Implement input validation and sanitization
  - Add validation middleware for all routes
  - Sanitize inputs to prevent injection attacks
  - _Requirements: 20.3_

- [x] 12.9 Write integration tests for API routes
  - Test all authentication flows
  - Test stream lifecycle endpoints
  - Test purchase execution flow
  - Test agent deployment and tracking
  - Test rate limiting
  - _Requirements: All_

- [x] 13. Implement Frontend - Streamer Web App
  - _Requirements: 3, 6, 18_

- [x] 13.1 Set up React project structure
  - Create React app with TypeScript
  - Configure routing with React Router
  - Set up state management (Context API or Zustand)
  - Configure Tailwind CSS for styling
  - _Requirements: All_

- [x] 13.2 Implement authentication UI
  - Create wallet connection modal (MetaMask, Hashio)
  - Create email login/register forms
  - Implement JWT token storage and refresh
  - Add authentication guards for protected routes
  - _Requirements: 1, 2_

- [x] 13.3 Implement stream creation UI
  - Create stream configuration form (title, category, quality)
  - Implement WebRTC producer setup
  - Display local video preview
  - Show stream start confirmation
  - _Requirements: 3.1_

- [x] 13.4 Implement streaming dashboard
  - Display live viewer count
  - Show token symbol and current market cap
  - Display real-time bonding curve chart with Recharts
  - Show recent purchases feed
  - Display total earnings
  - _Requirements: 3, 11, 18_

- [x] 13.5 Implement AI agent deployment UI
  - Create agent template selector
  - Implement 3D agent positioning with Three.js
  - Add agent configuration form (name, default purchase amount)
  - Display deployed agents list with statistics
  - _Requirements: 6, 7, 19_

- [x] 13.6 Implement analytics dashboard
  - Display total earnings across all streams
  - Show stream history table
  - Display token performance metrics
  - Show agent performance comparison
  - _Requirements: 18, 19_

- [x] 13.7 Write E2E tests for streamer flows
  - Test wallet connection and authentication
  - Test stream creation and token generation
  - Test agent deployment
  - Test earnings dashboard
  - _Requirements: 1, 3, 6, 18_

- [x] 14. Implement Frontend - Viewer Web App
  - _Requirements: 4, 9, 11, 13, 14_

- [x] 14.1 Implement stream discovery UI
  - Create stream grid with thumbnails
  - Add search bar with real-time filtering
  - Implement category filters
  - Show hot streams section
  - _Requirements: 4.1, 4.2, 4.4_

- [x] 14.2 Implement stream viewing UI
  - Create video player with WebRTC consumer
  - Display streamer info and token details
  - Show live viewer count
  - Implement chat interface
  - _Requirements: 4.3, 13_

- [x] 14.3 Implement 3D AR agent rendering
  - Set up Three.js scene with @react-three/fiber
  - Render deployed agents as 3D objects
  - Implement click detection on agents
  - Add hover effects and animations
  - _Requirements: 6.2, 6.5_

- [x] 14.4 Implement token purchase UI
  - Create purchase modal triggered by agent click
  - Display price quote with slippage
  - Show bonding curve visualization
  - Implement one-click quick buy
  - Handle transaction confirmation
  - _Requirements: 9_

- [x] 14.5 Implement real-time updates
  - Connect to WebSocket server
  - Subscribe to price updates and render bonding curve
  - Display purchase notifications
  - Show graduation announcements
  - Update chat messages in real-time
  - _Requirements: 11, 13, 14_

- [x] 14.6 Implement user portfolio
  - Display owned tokens with current values
  - Show purchase history
  - Calculate profit/loss
  - _Requirements: 9_

- [x] 14.7 Write E2E tests for viewer flows
  - Test stream discovery and search
  - Test video playback
  - Test agent interaction and purchase
  - Test chat functionality
  - _Requirements: 4, 9, 11, 13_

- [-] 15. Implement caching and optimization
  - _Requirements: 11, 21_

- [x] 15.1 Set up Redis caching
  - Configure Redis client
  - Cache bonding curve states with 1-second TTL
  - Cache active stream list with 5-second TTL
  - Cache token metadata
  - _Requirements: 11, 21_

- [x] 15.2 Implement price update batching
  - Batch price updates every 100ms
  - Aggregate multiple purchases before broadcasting
  - _Requirements: 11.5, 21.2_

- [x] 15.3 Optimize database queries
  - Add indexes on frequently queried columns
  - Implement connection pooling
  - Use prepared statements
  - _Requirements: 21.4_

- [x] 15.4 Write performance tests
  - Test 10 concurrent streams with 50 viewers each
  - Test 100 purchases per minute
  - Measure video latency
  - Measure price update latency
  - Verify p95 API response time < 500ms
  - _Requirements: 21, 22_

- [x] 16. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 17. Deployment and infrastructure setup
  - _Requirements: All_

- [x] 17.1 Create Docker containers
  - Write Dockerfile for backend services
  - Write Dockerfile for frontend apps
  - Create docker-compose.yml for local development
  - _Requirements: All_

- [x] 17.2 Set up AWS infrastructure
  - Configure EC2 instances for application tier
  - Set up RDS PostgreSQL database
  - Configure ElastiCache Redis
  - Create S3 bucket for thumbnails
  - Set up CloudFront CDN
  - _Requirements: All_

- [x] 17.3 Configure monitoring and logging
  - Set up CloudWatch logs
  - Configure Prometheus metrics
  - Create Grafana dashboards
  - Set up Sentry error tracking
  - Configure PagerDuty alerts
  - _Requirements: All_

- [x] 17.4 Deploy to testnet
  - Deploy smart contracts to Hedera testnet
  - Deploy smart contracts to Base Sepolia
  - Deploy backend services to EC2
  - Deploy frontend to Vercel
  - Verify end-to-end functionality
  - _Requirements: All_
