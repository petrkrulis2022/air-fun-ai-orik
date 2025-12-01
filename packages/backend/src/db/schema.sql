-- Authentication Schema for air.fun MVP
-- PostgreSQL Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(20) NOT NULL CHECK (role IN ('streamer', 'viewer')),
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  username VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
  
  -- Streamer-specific fields
  profile_category VARCHAR(100),
  total_tokens_created INTEGER DEFAULT 0,
  total_earnings DECIMAL(20, 6) DEFAULT 0,
  
  -- Viewer-specific fields
  total_spent DECIMAL(20, 6) DEFAULT 0,
  total_tokens_bought DECIMAL(20, 6) DEFAULT 0,
  agent_click_count INTEGER DEFAULT 0,
  
  -- Constraints
  CONSTRAINT email_or_wallet_required CHECK (
    email IS NOT NULL OR 
    EXISTS (SELECT 1 FROM wallet_addresses WHERE wallet_addresses.user_id = id)
  )
);

-- Wallet addresses table
CREATE TABLE IF NOT EXISTS wallet_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chain VARCHAR(20) NOT NULL CHECK (chain IN ('hedera', 'base')),
  address VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
  
  -- Constraints
  UNIQUE(chain, address),
  UNIQUE(user_id, chain, is_primary) WHERE is_primary = TRUE
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(500) NOT NULL UNIQUE,
  expires_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
  last_used_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_wallet_addresses_user_id ON wallet_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_addresses_address ON wallet_addresses(address);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Memecoins table
CREATE TABLE IF NOT EXISTS memecoins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL,
  streamer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Token Details
  name VARCHAR(255) NOT NULL,
  symbol VARCHAR(10) NOT NULL UNIQUE,
  total_supply DECIMAL(20, 6) NOT NULL DEFAULT 1000000000,
  bonding_curve_supply DECIMAL(20, 6) NOT NULL DEFAULT 800000000,
  
  -- State
  current_price DECIMAL(20, 10) NOT NULL DEFAULT 0,
  market_cap DECIMAL(20, 6) NOT NULL DEFAULT 0,
  liquidity_raised DECIMAL(20, 6) NOT NULL DEFAULT 0,
  tokens_sold DECIMAL(20, 6) NOT NULL DEFAULT 0,
  
  -- Graduation
  graduation_target DECIMAL(20, 6) NOT NULL DEFAULT 69000,
  is_graduated BOOLEAN DEFAULT FALSE,
  liquidity_pool_address VARCHAR(255),
  
  -- Blockchain
  hedera_contract_address VARCHAR(255),
  base_contract_address VARCHAR(255),
  
  -- Metadata
  logo_url TEXT,
  description TEXT,
  twitter_link VARCHAR(255),
  telegram_link VARCHAR(255),
  
  -- Timestamps
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
  updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
  
  -- Constraints
  CONSTRAINT tokens_sold_lte_supply CHECK (tokens_sold <= bonding_curve_supply)
);

-- Bonding curve states table
CREATE TABLE IF NOT EXISTS bonding_curve_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES memecoins(id) ON DELETE CASCADE UNIQUE,
  
  -- Bonding Curve Parameters
  k DECIMAL(20, 15) NOT NULL DEFAULT 0.000000001,
  tokens_sold DECIMAL(20, 6) NOT NULL DEFAULT 0,
  current_price DECIMAL(20, 10) NOT NULL DEFAULT 0,
  market_cap DECIMAL(20, 6) NOT NULL DEFAULT 0,
  next_price DECIMAL(20, 10) NOT NULL DEFAULT 0,
  
  -- Graduation
  graduation_threshold DECIMAL(20, 6) NOT NULL DEFAULT 69000,
  progress_to_graduation DECIMAL(5, 4) NOT NULL DEFAULT 0,
  
  -- Timestamp
  updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
);

-- Liquidity pools table
CREATE TABLE IF NOT EXISTS liquidity_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES memecoins(id) ON DELETE CASCADE,
  chain VARCHAR(20) NOT NULL CHECK (chain IN ('hedera', 'base')),
  pool_address VARCHAR(255) NOT NULL,
  token_reserve DECIMAL(20, 6) NOT NULL DEFAULT 0,
  air_reserve DECIMAL(20, 6) NOT NULL DEFAULT 0,
  lp_tokens_burned BOOLEAN DEFAULT FALSE,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
  
  -- Constraints
  UNIQUE(token_id, chain)
);

-- Indexes for token tables
CREATE INDEX IF NOT EXISTS idx_memecoins_stream_id ON memecoins(stream_id);
CREATE INDEX IF NOT EXISTS idx_memecoins_streamer_id ON memecoins(streamer_id);
CREATE INDEX IF NOT EXISTS idx_memecoins_symbol ON memecoins(symbol);
CREATE INDEX IF NOT EXISTS idx_memecoins_is_graduated ON memecoins(is_graduated);
CREATE INDEX IF NOT EXISTS idx_bonding_curve_states_token_id ON bonding_curve_states(token_id);
CREATE INDEX IF NOT EXISTS idx_liquidity_pools_token_id ON liquidity_pools(token_id);
CREATE INDEX IF NOT EXISTS idx_liquidity_pools_chain ON liquidity_pools(chain);

-- Database functions
CREATE OR REPLACE FUNCTION increment(table_name TEXT, row_id UUID, column_name TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE %I SET %I = COALESCE(%I, 0) + 1 WHERE id = $1', table_name, column_name, column_name)
  USING row_id;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION increment_total_tokens_created(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET total_tokens_created = COALESCE(total_tokens_created, 0) + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Streams table
CREATE TABLE IF NOT EXISTS streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  thumbnail_url TEXT,
  started_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
  ended_at BIGINT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('live', 'ended')) DEFAULT 'live',
  
  -- Associated Token
  token_id UUID REFERENCES memecoins(id) ON DELETE SET NULL,
  token_symbol VARCHAR(10),
  token_market_cap DECIMAL(20, 6),
  
  -- Metrics
  peak_viewer_count INTEGER DEFAULT 0,
  total_viewers INTEGER DEFAULT 0,
  total_tokens_sold DECIMAL(20, 6) DEFAULT 0,
  total_volume DECIMAL(20, 6) DEFAULT 0,
  total_earnings DECIMAL(20, 6) DEFAULT 0,
  agent_click_count INTEGER DEFAULT 0,
  
  -- Configuration
  quality VARCHAR(10) NOT NULL CHECK (quality IN ('720p', '1080p')) DEFAULT '720p',
  enable_chat BOOLEAN DEFAULT TRUE
);

-- Indexes for streams table
CREATE INDEX IF NOT EXISTS idx_streams_streamer_id ON streams(streamer_id);
CREATE INDEX IF NOT EXISTS idx_streams_status ON streams(status);
CREATE INDEX IF NOT EXISTS idx_streams_category ON streams(category);
CREATE INDEX IF NOT EXISTS idx_streams_started_at ON streams(started_at);
CREATE INDEX IF NOT EXISTS idx_streams_token_id ON streams(token_id);

-- Agent templates table
CREATE TABLE IF NOT EXISTS agent_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('buy_button', 'challenge_giver', 'predictor', 'leaderboard')),
  model_url TEXT NOT NULL,
  default_color VARCHAR(7) NOT NULL, -- Hex color code
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES agent_templates(id) ON DELETE RESTRICT,
  name VARCHAR(100) NOT NULL,
  
  -- Position in 3D space
  position_x DECIMAL(10, 6) NOT NULL,
  position_y DECIMAL(10, 6) NOT NULL,
  position_z DECIMAL(10, 6) NOT NULL,
  
  -- Configuration
  default_purchase_amount DECIMAL(20, 6) NOT NULL DEFAULT 1000,
  quick_buy_enabled BOOLEAN DEFAULT TRUE,
  
  -- Challenge configuration (JSON)
  challenge_config JSONB,
  
  -- Status
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'paused', 'removed')) DEFAULT 'active',
  
  -- Timestamps
  deployed_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
  removed_at BIGINT
);

-- Agent deployments table (tracks performance per deployment)
CREATE TABLE IF NOT EXISTS agent_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  
  -- Performance metrics
  total_clicks INTEGER DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,
  total_volume DECIMAL(20, 6) DEFAULT 0,
  conversion_rate DECIMAL(5, 4) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'paused', 'removed')) DEFAULT 'active',
  
  -- Timestamps
  deployed_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
  removed_at BIGINT
);

-- Agent clicks table (tracks individual clicks)
CREATE TABLE IF NOT EXISTS agent_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  clicked_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
);

-- Agent purchases table (links purchases to agents)
CREATE TABLE IF NOT EXISTS agent_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  
  -- Purchase details
  token_amount DECIMAL(20, 6) NOT NULL,
  usdc_amount DECIMAL(20, 6) NOT NULL,
  
  -- Timestamp
  purchased_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
);

-- Indexes for agent tables
CREATE INDEX IF NOT EXISTS idx_agent_templates_type ON agent_templates(type);
CREATE INDEX IF NOT EXISTS idx_agents_stream_id ON agents(stream_id);
CREATE INDEX IF NOT EXISTS idx_agents_template_id ON agents(template_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agent_deployments_agent_id ON agent_deployments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_deployments_stream_id ON agent_deployments(stream_id);
CREATE INDEX IF NOT EXISTS idx_agent_clicks_agent_id ON agent_clicks(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_clicks_user_id ON agent_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_clicks_stream_id ON agent_clicks(stream_id);
CREATE INDEX IF NOT EXISTS idx_agent_purchases_agent_id ON agent_purchases(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_purchases_user_id ON agent_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_purchases_stream_id ON agent_purchases(stream_id);
