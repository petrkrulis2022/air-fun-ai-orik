# Database Setup Guide

This guide explains how to set up the PostgreSQL database schema for the air.fun MVP.

## Prerequisites

- Supabase project created
- Supabase credentials configured in `.env` file

## Setup Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Select your project
3. Navigate to the SQL Editor (left sidebar)
4. Copy the contents of `src/db/schema.sql`
5. Paste into the SQL Editor
6. Click "Run" to execute the schema
7. Copy the contents of `src/db/seed-agent-templates.sql`
8. Paste into the SQL Editor
9. Click "Run" to seed the agent templates

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push

# Or run SQL directly
supabase db execute --file src/db/schema.sql
supabase db execute --file src/db/seed-agent-templates.sql
```

### Option 3: Using psql

If you have direct PostgreSQL access:

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the schema
\i src/db/schema.sql

# Seed agent templates
\i src/db/seed-agent-templates.sql
```

## Verification

After setup, verify the tables were created:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check agent templates were seeded
SELECT * FROM agent_templates;
```

You should see the following tables:

- users
- wallet_addresses
- sessions
- memecoins
- bonding_curve_states
- liquidity_pools
- streams
- agent_templates
- agents
- agent_deployments
- agent_clicks
- agent_purchases

And 4 agent templates:

- Buy Button
- Challenge Giver
- Predictor
- Leaderboard

## Running Tests

Once the database is set up, you can run the tests:

```bash
# Run all tests
npm test

# Run specific test files
npm test -- ai-agent.service.test.ts --run
npm test -- ai-agent.property.test.ts --run
```

## Troubleshooting

### Error: relation "users" does not exist

This means the schema hasn't been applied. Follow the setup steps above.

### Error: Failed to create test user

This usually means:

1. The schema hasn't been applied, or
2. There's a constraint violation (e.g., duplicate email)

Try dropping and recreating the tables, or use unique test data.

### Connection Issues

Verify your Supabase credentials in `.env`:

- `SUPABASE_URL` should be your project URL
- `SUPABASE_ANON_KEY` for client connections
- `SUPABASE_SERVICE_ROLE_KEY` for admin operations (keep secret!)

## Notes

- The schema includes all necessary tables for the AI Agent Service
- Agent templates are pre-seeded with 4 default templates
- The database uses UUID primary keys and timestamps in milliseconds
- Indexes are created for optimal query performance
