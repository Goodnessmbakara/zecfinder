# ZecFinder Backend

Backend API server for ZecFinder AI agent and Zcash wallet integration.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Set your environment variables in `.env`:
- `GEMINI_API_KEY` - Your Google Gemini API key
- `ZCASH_RPC_URL` - Zcash node RPC endpoint (default: http://localhost:8232)
- `ZCASH_RPC_USER` - RPC username (if required)
- `ZCASH_RPC_PASSWORD` - RPC password (if required)
- `ZCASH_NETWORK` - 'testnet' or 'mainnet' (default: testnet)
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:5173)

## Development

Run the development server:
```bash
pnpm dev
```

The server will start on `http://localhost:3001` (or your configured PORT).

## API Endpoints

### Chat
- `POST /api/chat` - Process natural language commands

### Wallet
- `POST /api/wallet/create` - Create new wallet
- `POST /api/wallet/import` - Import existing wallet
- `GET /api/wallet/balance` - Get wallet balance
- `GET /api/wallet/address` - Get wallet address

### Transaction
- `POST /api/transaction/send` - Send transaction

## Health Check

- `GET /health` - Server health check

