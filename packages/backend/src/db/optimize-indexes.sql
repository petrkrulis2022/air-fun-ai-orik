-- Database Query Optimization
-- Additional indexes for frequently queried columns (Requirement 21.4)

-- Purchases table indexes (if not already created)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES memecoins(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(20, 6) NOT NULL,
  price DECIMAL(20, 10) NOT NULL,
  total_spent DECIMAL(20, 6) NOT NULL,
  creator_fee DECIMAL(20, 6) NOT NULL,
  platform_fee DECIMAL(20, 6) NOT NULL,
  tx_hash VARCHAR(255) NOT NULL,
  timestamp BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
);

-- Composite indexes for common query patterns
-- These improve performance for queries that filter by multiple columns

-- Streams: Filter by status and category (common in discovery)
CREATE INDEX IF NOT EXISTS idx_streams_status_category ON streams(status, category);

-- Streams: Filter by status and order by started_at (hot streams)
CREATE INDEX IF NOT EXISTS idx_streams_status_started_at ON streams(status, started_at DESC);

-- Streams: Filter by status and market cap (hot streams with market cap filter)
CREATE INDEX IF NOT EXISTS idx_streams_status_market_cap ON streams(status, token_market_cap DESC NULLS LAST);

-- Memecoins: Filter by graduated status and market cap
CREATE INDEX IF NOT EXISTS idx_memecoins_graduated_market_cap ON memecoins(is_graduated, market_cap DESC);

-- Purchases: Query by token and timestamp (purchase history)
CREATE INDEX IF NOT EXISTS idx_purchases_token_timestamp ON purchases(token_id, timestamp DESC);

-- Purchases: Query by buyer and timestamp (user purchase history)
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_timestamp ON purchases(buyer_id, timestamp DESC);

-- Purchases: Query by token for analytics
CREATE INDEX IF NOT EXISTS idx_purchases_token_id ON purchases(token_id);

-- Purchases: Query by buyer for portfolio
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_id ON purchases(buyer_id);

-- Agent clicks: Query by agent and timestamp
CREATE INDEX IF NOT EXISTS idx_agent_clicks_agent_timestamp ON agent_clicks(agent_id, clicked_at DESC);

-- Agent purchases: Query by agent and timestamp
CREATE INDEX IF NOT EXISTS idx_agent_purchases_agent_timestamp ON agent_purchases(agent_id, purchased_at DESC);

-- Bonding curve states: Ensure unique constraint and fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_bonding_curve_states_token_id_unique ON bonding_curve_states(token_id);

-- Sessions: Clean up expired sessions efficiently
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at_asc ON sessions(expires_at ASC);

-- Partial indexes for active/live records only (smaller, faster indexes)
-- These indexes only include rows that match the WHERE clause

-- Active streams only (most queries are for live streams)
CREATE INDEX IF NOT EXISTS idx_streams_live_started_at ON streams(started_at DESC) WHERE status = 'live';

-- Active agents only
CREATE INDEX IF NOT EXISTS idx_agents_active_stream ON agents(stream_id) WHERE status = 'active';

-- Non-graduated tokens only (most queries are for active bonding curves)
CREATE INDEX IF NOT EXISTS idx_memecoins_active_market_cap ON memecoins(market_cap DESC) WHERE is_graduated = FALSE;

-- Covering indexes (include additional columns to avoid table lookups)
-- These indexes include extra columns so queries can be satisfied from the index alone

-- Streams discovery with all needed fields
CREATE INDEX IF NOT EXISTS idx_streams_discovery ON streams(status, started_at DESC) 
  INCLUDE (title, category, thumbnail_url, token_symbol, token_market_cap, peak_viewer_count);

-- User wallet addresses with chain info
CREATE INDEX IF NOT EXISTS idx_wallet_addresses_user_chain ON wallet_addresses(user_id, chain) 
  INCLUDE (address, is_primary, verified);

-- Analyze tables to update statistics for query planner
ANALYZE users;
ANALYZE wallet_addresses;
ANALYZE sessions;
ANALYZE memecoins;
ANALYZE bonding_curve_states;
ANALYZE liquidity_pools;
ANALYZE streams;
ANALYZE agent_templates;
ANALYZE agents;
ANALYZE agent_deployments;
ANALYZE agent_clicks;
ANALYZE agent_purchases;
ANALYZE purchases;

-- Vacuum tables to reclaim space and update statistics
VACUUM ANALYZE users;
VACUUM ANALYZE wallet_addresses;
VACUUM ANALYZE sessions;
VACUUM ANALYZE memecoins;
VACUUM ANALYZE bonding_curve_states;
VACUUM ANALYZE liquidity_pools;
VACUUM ANALYZE streams;
VACUUM ANALYZE agent_templates;
VACUUM ANALYZE agents;
VACUUM ANALYZE agent_deployments;
VACUUM ANALYZE agent_clicks;
VACUUM ANALYZE agent_purchases;
VACUUM ANALYZE purchases;
