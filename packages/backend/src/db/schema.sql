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
