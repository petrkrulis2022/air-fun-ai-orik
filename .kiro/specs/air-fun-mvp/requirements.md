# Requirements Document

## Introduction

air.fun is a decentralized livestreaming platform that combines real-time video broadcasting with pump.fun-style memecoin launches. The platform enables streamers to monetize their content through automatic token creation and bonding curve pricing, where viewers purchase streamer memecoins by interacting with AI agents deployed as 3D AR objects during livestreams. The MVP targets 10 concurrent streams with 500 concurrent viewers, prioritizing sub-3-second video latency and sub-500ms price update synchronization across dual-chain support (Hedera testnet, Base Sepolia).

## Glossary

- **Streamer**: A user who broadcasts live video content and automatically receives a memecoin upon stream creation
- **Viewer**: A user who watches livestreams and purchases streamer memecoins through AI agent interactions
- **AI Agent**: A 3D AR object deployed by streamers that acts as an interactive buy button for memecoin purchases
- **Memecoin**: An automatically generated token (e.g., $STREAMER_NAME) created when a stream starts
- **Bonding Curve**: A mathematical pricing formula (price = k \* supply²) that automatically adjusts token price based on supply
- **Purchase**: A transaction where a viewer buys memecoin tokens using USDC through the bonding curve
- **Graduation**: The process when a token reaches $69k market cap and a permanent liquidity pool is created
- **Liquidity Pool**: A MEMECOIN/AIR trading pair created upon graduation with burned LP tokens for rug-pull protection
- **Platform**: The air.fun system including all services and infrastructure
- **WebRTC**: Web Real-Time Communication protocol for peer-to-peer video streaming
- **Smart Contract**: Self-executing blockchain code that handles token creation, purchases, and fee distribution
- **AIR Token**: The platform's native token used for liquidity pool pairing

## Requirements

### Requirement 1: Web3 Wallet Authentication

**User Story:** As a streamer, I want to authenticate using my Web3 wallet, so that I can receive memecoin trading fees directly to my blockchain address.

#### Acceptance Criteria

1. WHEN a streamer connects a Web3 wallet (MetaMask or Hashio), THE Platform SHALL verify the wallet signature using EIP-191 standard
2. WHEN wallet signature verification succeeds, THE Platform SHALL generate a JWT access token with 1-hour expiration
3. WHEN a streamer links multiple wallet addresses across chains, THE Platform SHALL associate all addresses with the user account
4. WHEN a wallet disconnection occurs, THE Platform SHALL invalidate the current session immediately

### Requirement 2: Email Authentication for Viewers

**User Story:** As a viewer unfamiliar with cryptocurrency, I want to authenticate using email and password, so that I can access the platform without a Web3 wallet.

#### Acceptance Criteria

1. WHEN a viewer registers with email and password, THE Platform SHALL create an account and generate authentication tokens
2. WHEN a viewer logs in with valid credentials, THE Platform SHALL return a JWT access token and refresh token
3. WHEN an access token expires, THE Platform SHALL accept a valid refresh token to issue a new access token
4. WHEN authentication attempts exceed 10 per IP address per minute, THE Platform SHALL reject additional attempts with rate limit error

### Requirement 3: Livestream Management

**User Story:** As a streamer, I want to start and stop livestreams with configurable settings, so that I can broadcast content to viewers.

#### Acceptance Criteria

1. WHEN a streamer starts a stream with valid configuration (title, category, quality), THE Platform SHALL create a WebRTC producer transport and return connection parameters
2. WHEN a stream starts, THE Platform SHALL automatically generate a memecoin for the streamer within 5 seconds
3. WHEN a stream is active, THE Platform SHALL generate and store a thumbnail image to S3 within 10 seconds
4. WHEN a streamer ends a stream, THE Platform SHALL close all WebRTC connections and return a summary with total viewers, peak viewers, total earnings, and total tokens sold
5. WHEN stream quality is set to 720p or 1080p, THE Platform SHALL configure WebRTC transport with corresponding resolution parameters

### Requirement 4: Stream Discovery and Viewing

**User Story:** As a viewer, I want to browse and search for active livestreams, so that I can find content that interests me.

#### Acceptance Criteria

1. WHEN a viewer requests active streams, THE Platform SHALL return a list with stream metadata including viewer count, token symbol, and market cap
2. WHEN a viewer searches with a query string, THE Platform SHALL return streams matching the query in title or category
3. WHEN a viewer joins a stream, THE Platform SHALL create a WebRTC consumer transport and deliver video with less than 3 seconds latency
4. WHEN a viewer requests hot streams, THE Platform SHALL return streams ordered by viewer count and token market cap

### Requirement 5: Automatic Memecoin Creation

**User Story:** As a streamer, I want a memecoin automatically created when I start streaming, so that viewers can purchase my token without manual setup.

#### Acceptance Criteria

1. WHEN a streamer starts a stream, THE Platform SHALL generate a unique token symbol (3-5 characters) based on the streamer name
2. WHEN a memecoin is created, THE Platform SHALL deploy the token contract on both Hedera testnet and Base Sepolia
3. WHEN a memecoin is created, THE Platform SHALL set total supply to 1 billion tokens with 800 million available on the bonding curve
4. WHEN a memecoin is created, THE Platform SHALL initialize the bonding curve with k = 0.000000001 and starting price calculated from the formula
5. WHEN token symbol generation fails due to collision, THE Platform SHALL append a numeric suffix and retry

### Requirement 6: AI Agent Deployment and Management

**User Story:** As a streamer, I want to deploy AI agents as 3D AR buy buttons during my livestream, so that viewers can interact with them to purchase my memecoin.

#### Acceptance Criteria

1. WHEN a streamer deploys an agent with valid configuration, THE Platform SHALL create a deployment record with 3D position coordinates
2. WHEN an agent is deployed, THE Platform SHALL make the agent visible to all viewers in the stream as a 3D AR object
3. WHEN a streamer updates an agent position, THE Platform SHALL broadcast the new position to all viewers within 500ms
4. WHEN a streamer removes an agent, THE Platform SHALL hide the agent from all viewers and set deployment status to removed
5. WHEN a viewer clicks an agent, THE Platform SHALL track the click and attribute any resulting purchase to that agent

### Requirement 7: AI Agent Templates

**User Story:** As a streamer, I want to choose from pre-built AI agent templates, so that I can quickly deploy agents with different visual styles and behaviors.

#### Acceptance Criteria

1. WHEN a streamer requests agent templates, THE Platform SHALL return 4 templates (buy_button, challenge_giver, predictor, leaderboard)
2. WHEN a streamer selects a template, THE Platform SHALL provide the template's 3D model URL and default configuration
3. WHEN a streamer creates an agent from a template, THE Platform SHALL apply the template's default color and model
4. WHEN a streamer retrieves a specific template, THE Platform SHALL return the template details including type, name, and description

### Requirement 8: Bonding Curve Price Calculation

**User Story:** As the platform, I want to calculate token prices using a bonding curve formula, so that early buyers get lower prices and prices increase with demand.

#### Acceptance Criteria

1. WHEN calculating token price, THE Platform SHALL use the formula: price = k \* tokensSold² where k = 0.000000001
2. WHEN a viewer requests a price quote for a token amount, THE Platform SHALL calculate the total USDC cost by integrating the bonding curve over the purchase range
3. WHEN calculating a price quote, THE Platform SHALL include price per token, total cost, price impact percentage, and estimated gas
4. WHEN tokens are sold, THE Platform SHALL ensure the next price is greater than or equal to the previous price (monotonic increase)
5. WHEN calculating market cap, THE Platform SHALL multiply current price by tokens sold

### Requirement 9: Token Purchase Execution

**User Story:** As a viewer, I want to purchase streamer memecoins by clicking AI agents, so that I can support streamers and potentially profit from token appreciation.

#### Acceptance Criteria

1. WHEN a viewer initiates a purchase, THE Platform SHALL validate the purchase amount is at least $1 USDC
2. WHEN a viewer initiates a purchase, THE Platform SHALL validate the viewer has sufficient USDC balance in their wallet
3. WHEN a purchase is validated, THE Platform SHALL execute the bonding curve purchase on the blockchain and lock USDC funds
4. WHEN a purchase executes, THE Platform SHALL update the token's tokensSold count and recalculate the current price
5. WHEN a purchase completes, THE Platform SHALL transfer tokens to the buyer's wallet and return a transaction hash
6. WHEN actual execution price exceeds quoted price by more than max slippage (default 0.5%), THE Platform SHALL revert the transaction

### Requirement 10: Fee Distribution

**User Story:** As a streamer, I want to receive 98% of all trading fees from my memecoin, so that I can maximize my earnings from viewer purchases.

#### Acceptance Criteria

1. WHEN a token purchase completes, THE Platform SHALL calculate creator fee as 98% of the total USDC spent
2. WHEN a token purchase completes, THE Platform SHALL calculate platform fee as 2% of the total USDC spent
3. WHEN fees are calculated, THE Platform SHALL verify that creator fee + platform fee equals exactly 100% of purchase amount
4. WHEN fees are distributed, THE Platform SHALL transfer creator fee to the streamer's primary wallet address
5. WHEN fees are distributed, THE Platform SHALL transfer platform fee to the platform wallet address

### Requirement 11: Real-Time Price Updates

**User Story:** As a viewer, I want to see token prices update in real-time, so that I can make informed purchase decisions based on current market conditions.

#### Acceptance Criteria

1. WHEN a token purchase occurs, THE Platform SHALL broadcast the updated price state to all viewers in the stream within 500ms
2. WHEN price state is broadcast, THE Platform SHALL include current price, next price preview, market cap, and graduation progress
3. WHEN multiple purchases occur concurrently, THE Platform SHALL process them in timestamp order and broadcast sequential price updates
4. WHEN a viewer joins a stream, THE Platform SHALL immediately send the current bonding curve state
5. WHEN price updates are broadcast, THE Platform SHALL use WebSocket connections for sub-500ms delivery

### Requirement 12: Token Graduation

**User Story:** As a streamer, I want my memecoin to graduate to a permanent liquidity pool when it reaches $69k market cap, so that the token has long-term trading viability.

#### Acceptance Criteria

1. WHEN a token's market cap reaches or exceeds $69,000, THE Platform SHALL initiate the graduation process
2. WHEN graduation initiates, THE Platform SHALL create a liquidity pool pairing the memecoin with AIR platform token
3. WHEN a liquidity pool is created, THE Platform SHALL burn all LP tokens to prevent rug pulls
4. WHEN graduation completes, THE Platform SHALL broadcast a graduation announcement to all viewers in the stream
5. WHEN a token has graduated, THE Platform SHALL prevent further bonding curve purchases and direct users to the liquidity pool

### Requirement 13: Live Chat Functionality

**User Story:** As a viewer, I want to send chat messages during livestreams, so that I can communicate with the streamer and other viewers.

#### Acceptance Criteria

1. WHEN a viewer sends a chat message, THE Platform SHALL broadcast the message to all viewers in the stream within 1 second
2. WHEN a chat message is broadcast, THE Platform SHALL include the sender's username, message text, and timestamp
3. WHEN chat is disabled for a stream, THE Platform SHALL reject chat messages with chat disabled error
4. WHEN a viewer mentions another user with @ symbol, THE Platform SHALL parse and include mentions in the message metadata

### Requirement 14: Purchase Notifications

**User Story:** As a viewer, I want to see notifications when other viewers purchase tokens, so that I can gauge market activity and sentiment.

#### Acceptance Criteria

1. WHEN a token purchase completes, THE Platform SHALL broadcast a purchase notification to all viewers in the stream
2. WHEN a purchase notification is broadcast, THE Platform SHALL include buyer username, token amount, price paid, and new market cap
3. WHEN large purchases occur (>$100), THE Platform SHALL highlight the notification with special visual treatment
4. WHEN purchase notifications are broadcast, THE Platform SHALL deliver them within 1 second of purchase completion

### Requirement 15: WebRTC Connection Management

**User Story:** As a user, I want reliable video streaming connections, so that I can stream or watch content without interruptions.

#### Acceptance Criteria

1. WHEN a WebRTC connection fails, THE Platform SHALL attempt automatic reconnection with exponential backoff (1s, 2s, 4s, 8s, 15s) for up to 30 seconds
2. WHEN reconnection attempts are exhausted, THE Platform SHALL notify the user and provide option to reload the stream
3. WHEN a WebRTC transport is created, THE Platform SHALL return DTLS parameters for secure connection establishment
4. WHEN media is produced or consumed, THE Platform SHALL handle RTP parameters for audio and video tracks

### Requirement 16: WebSocket Connection Recovery

**User Story:** As a user, I want my real-time connection to recover automatically, so that I don't miss price updates or chat messages during brief network interruptions.

#### Acceptance Criteria

1. WHEN a WebSocket disconnects, THE Platform SHALL attempt automatic reconnection using Socket.io built-in retry logic
2. WHEN a client reconnects, THE Platform SHALL accept the last received event ID from the client
3. WHEN a client provides a last event ID, THE Platform SHALL replay all missed events from the event log
4. WHEN event replay completes, THE Platform SHALL resume normal real-time message delivery

### Requirement 17: Smart Contract Transaction Monitoring

**User Story:** As a user, I want to track my blockchain transactions, so that I can verify transaction status and troubleshoot issues.

#### Acceptance Criteria

1. WHEN a transaction is submitted, THE Platform SHALL poll transaction status every 5 seconds for up to 60 seconds
2. WHEN a transaction is confirmed, THE Platform SHALL update the purchase status to confirmed and notify the user
3. WHEN a transaction fails, THE Platform SHALL update the status to failed and provide the transaction hash for blockchain explorer lookup
4. WHEN a transaction times out after 60 seconds, THE Platform SHALL mark it as pending and continue monitoring in the background

### Requirement 18: Streamer Analytics Dashboard

**User Story:** As a streamer, I want to view analytics about my streams and token performance, so that I can understand my audience and earnings.

#### Acceptance Criteria

1. WHEN a streamer views their dashboard, THE Platform SHALL display total earnings across all streams
2. WHEN a streamer views stream history, THE Platform SHALL show peak viewers, total viewers, duration, total tokens sold, and total earnings for each stream
3. WHEN a streamer views token performance, THE Platform SHALL display current market cap, holder count, transaction count, and graduation status
4. WHEN a stream ends, THE Platform SHALL calculate and store analytics metrics within 10 seconds

### Requirement 19: Agent Performance Tracking

**User Story:** As a streamer, I want to see which AI agents generate the most purchases, so that I can optimize agent placement and configuration.

#### Acceptance Criteria

1. WHEN a viewer clicks an agent, THE Platform SHALL increment the agent's click count
2. WHEN a purchase is made through an agent, THE Platform SHALL increment the agent's purchase count and add to total volume
3. WHEN a streamer views agent statistics, THE Platform SHALL display total clicks, total purchases, total volume, and conversion rate
4. WHEN calculating conversion rate, THE Platform SHALL divide total purchases by total clicks

### Requirement 20: Security and Rate Limiting

**User Story:** As the platform, I want to enforce security measures and rate limits, so that I can protect against abuse and attacks.

#### Acceptance Criteria

1. WHEN API requests exceed 100 per minute per user, THE Platform SHALL reject additional requests with rate limit error
2. WHEN authentication attempts exceed 10 per IP per minute, THE Platform SHALL reject additional attempts with rate limit error
3. WHEN a request is made, THE Platform SHALL validate and sanitize all input parameters to prevent injection attacks
4. WHEN sensitive data is transmitted, THE Platform SHALL use TLS 1.3 encryption for all connections
5. WHEN wallet signatures are verified, THE Platform SHALL use EIP-191 standard for secure signature validation

### Requirement 21: Performance Requirements

**User Story:** As a user, I want fast and responsive platform performance, so that I can stream, watch, and purchase tokens without delays.

#### Acceptance Criteria

1. WHEN video is streamed, THE Platform SHALL deliver video to viewers with less than 3 seconds latency from streamer to viewer
2. WHEN a price update occurs, THE Platform SHALL synchronize price state to all viewers within 500 milliseconds
3. WHEN a bonding curve calculation is performed, THE Platform SHALL complete the calculation in less than 100 milliseconds
4. WHEN API requests are made, THE Platform SHALL respond within 500 milliseconds for 95% of requests (p95)

### Requirement 22: Scalability Requirements

**User Story:** As the platform, I want to support multiple concurrent streams and viewers, so that the MVP can serve the target user base.

#### Acceptance Criteria

1. WHEN the platform is operational, THE Platform SHALL support 10 concurrent active streams simultaneously
2. WHEN the platform is operational, THE Platform SHALL support 500 concurrent viewers across all streams
3. WHEN viewer count per stream increases, THE Platform SHALL maintain video latency below 3 seconds
4. WHEN purchase volume increases to 100 purchases per minute, THE Platform SHALL maintain price update latency below 500 milliseconds

### Requirement 23: Multi-Chain Token Deployment

**User Story:** As a streamer, I want my memecoin deployed on multiple blockchains, so that viewers can purchase using their preferred network.

#### Acceptance Criteria

1. WHEN a memecoin is created, THE Platform SHALL deploy the token contract on Hedera testnet
2. WHEN a memecoin is created, THE Platform SHALL deploy the token contract on Base Sepolia testnet
3. WHEN a viewer purchases tokens, THE Platform SHALL execute the purchase on the chain specified by the viewer
4. WHEN displaying token information, THE Platform SHALL show contract addresses for both Hedera and Base deployments
5. WHEN a token graduates, THE Platform SHALL create liquidity pools on both Hedera and Base independently
