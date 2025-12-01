# Setup Instructions

## Initial Setup Steps

### 1. Initialize Git Repository

Run the following command in the project root:

```bash
git init
git add .
git commit -m "Initial commit: Project structure setup"
```

### 2. Install Dependencies

Install all workspace dependencies:

```bash
npm install
```

This will install dependencies for all packages in the monorepo.

### 3. Configure Environment Variables

Copy the environment variable templates and fill in your values:

```bash
# Root environment
cp .env.example .env

# Backend
cp packages/backend/.env.example packages/backend/.env

# Smart contracts
cp packages/contracts/.env.example packages/contracts/.env

# Frontend - Streamer
cp packages/frontend-streamer/.env.example packages/frontend-streamer/.env

# Frontend - Viewer
cp packages/frontend-viewer/.env.example packages/frontend-viewer/.env
```

### 4. Set Up External Services

#### Supabase (PostgreSQL Database)
1. Create a project at https://supabase.com
2. Copy your project URL and keys to `packages/backend/.env`

#### Redis
1. Install Redis locally or use a cloud provider
2. Update `REDIS_URL` in `packages/backend/.env`

#### AWS S3
1. Create an S3 bucket for thumbnails
2. Configure AWS credentials in `.env`

#### Hedera Testnet
1. Create a testnet account at https://portal.hedera.com
2. Add your account ID and private key to environment files

#### Base Sepolia
1. Get Base Sepolia RPC access
2. Add your private key to environment files

### 5. Verify Setup

Run the development servers to verify everything is working:

```bash
# Terminal 1 - Backend
cd packages/backend
npm run dev

# Terminal 2 - Streamer Frontend
cd packages/frontend-streamer
npm run dev

# Terminal 3 - Viewer Frontend
cd packages/frontend-viewer
npm run dev
```

The applications should be accessible at:
- Backend API: http://localhost:3000
- Streamer App: http://localhost:5173
- Viewer App: http://localhost:5174

## Next Steps

After completing the setup, you can begin implementing the features according to the task list in `.kiro/specs/air-fun-mvp/tasks.md`.

Start with task 2: Implement Authentication Service
