# Quick Start Guide

Get the air.fun MVP up and running in minutes.

## Prerequisites

Ensure you have installed:
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

## Installation

### 1. Install Dependencies

```bash
npm install
```

This will install all dependencies for all packages in the monorepo.

### 2. Start Local Services (Optional)

If you want to run PostgreSQL and Redis locally:

```bash
docker-compose up -d
```

Alternatively, use Supabase for PostgreSQL and a cloud Redis provider.

### 3. Configure Environment

Copy environment templates:

```bash
cp .env.example .env
cp packages/backend/.env.example packages/backend/.env
cp packages/contracts/.env.example packages/contracts/.env
cp packages/frontend-streamer/.env.example packages/frontend-streamer/.env
cp packages/frontend-viewer/.env.example packages/frontend-viewer/.env
```

**Minimum required configuration for local development:**

`packages/backend/.env`:
```env
NODE_ENV=development
PORT=3000
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-key
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
```

`packages/frontend-streamer/.env`:
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3001
```

`packages/frontend-viewer/.env`:
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3001
```

## Running the Application

### Option 1: Run All Services

```bash
npm run dev
```

This starts all services concurrently.

### Option 2: Run Services Individually

Open separate terminal windows:

**Terminal 1 - Backend:**
```bash
cd packages/backend
npm run dev
```

**Terminal 2 - Streamer Frontend:**
```bash
cd packages/frontend-streamer
npm run dev
```

**Terminal 3 - Viewer Frontend:**
```bash
cd packages/frontend-viewer
npm run dev
```

## Access the Applications

Once running, access:
- **Backend API**: http://localhost:3000
- **Streamer App**: http://localhost:5173
- **Viewer App**: http://localhost:5174

Test the backend health endpoint:
```bash
curl http://localhost:3000/health
```

## Next Steps

### For Development

1. Review the task list: `.kiro/specs/air-fun-mvp/tasks.md`
2. Read the design document: `.kiro/specs/air-fun-mvp/design.md`
3. Check the architecture: `ARCHITECTURE.md`
4. Follow contributing guidelines: `CONTRIBUTING.md`

### For Smart Contract Development

```bash
cd packages/contracts

# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to Hedera testnet
npm run deploy:hedera

# Deploy to Base Sepolia
npm run deploy:base
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific package
cd packages/backend
npm test

# Run with coverage
cd packages/backend
npx vitest --coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check
```

## Troubleshooting

### Port Already in Use

If ports 3000, 5173, or 5174 are in use:
1. Stop the conflicting process
2. Or change the port in the respective package's configuration

### Dependencies Not Installing

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules packages/*/node_modules
npm install
```

### TypeScript Errors

```bash
# Rebuild TypeScript
npm run build
```

### Environment Variables Not Loading

Ensure `.env` files are in the correct locations and properly formatted.

## Getting Help

- Check `SETUP.md` for detailed setup instructions
- Review `ARCHITECTURE.md` for system architecture
- Read the design document for feature specifications
- Check `CONTRIBUTING.md` for development guidelines

## Project Structure

```
air-fun-mvp/
├── packages/
│   ├── backend/           # Backend API and services
│   ├── frontend-streamer/ # Streamer web application
│   ├── frontend-viewer/   # Viewer web application
│   └── contracts/         # Smart contracts
├── .kiro/specs/          # Feature specifications
└── [config files]        # ESLint, Prettier, TypeScript, etc.
```

## Development Workflow

1. Pick a task from `tasks.md`
2. Create a feature branch
3. Implement the feature
4. Write tests
5. Run linting and formatting
6. Commit changes
7. Move to next task

Happy coding! 🚀
