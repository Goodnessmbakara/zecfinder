# ZecFinder

**Chat. Execute privately. Untraceable.**

A privacy-preserving, autonomous agent wallet for Zcash that enables natural language cryptocurrency transactions with zero-link routing and complete privacy.

## Overview

ZecFinder combines AI-powered intent parsing with Zcash's shielded pools to make private cryptocurrency transactions as simple as having a conversation. Execute transfers, swaps, and DeFi operations while maintaining complete privacy through zero-knowledge proofs.

## Features

### 🤖 AI-Powered Agent
- Natural language transaction execution
- Intent parsing and validation using Google Gemini AI
- Conversational interface for all operations
- Context-aware responses

### 🔒 Privacy by Default
- Zero-link routing prevents transaction correlation
- Automatic UTXO selection for privacy
- Shielded pool integration
- Untraceable transaction execution

### 🌐 Cross-Chain Capabilities
- NEAR Intents integration for cross-chain swaps
- Swap assets from any chain (BTC, SOL, USDC) to ZEC
- Private receipt of cross-chain assets
- Intent-based architecture

### 💼 Wallet Management
- Create or import Zcash wallets
- Transparent and shielded address support
- Balance queries and transaction history
- Browser wallet extension support (Zync, Brave, MetaMask with Zcash Snap)

### 🎯 Transaction Types
- **Send**: Private transfers to any Zcash address
- **Shield**: Move funds to shielded pools
- **Unshield**: Move funds from shielded pools
- **Swap**: Cross-chain asset swaps via NEAR Intents
- **Balance**: Query transparent and shielded balances

### 🎬 Demo Mode
- Test the application without a Zcash backend
- Mock wallet data and transaction simulations
- Full feature testing without blockchain connection

## Tech Stack

### Backend
- **Node.js** + **Express** - API server
- **TypeScript** - Type safety
- **Google Gemini AI** - Natural language processing
- **@mayaprotocol/zcash-js** - Zcash integration
- **SQLite** - User and wallet data storage
- **NEAR Intents API** - Cross-chain swap execution
- **Axios** - HTTP client

### Frontend
- **React** + **TypeScript** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Zustand** - State management
- **React Router** - Navigation
- **Radix UI** - Accessible components

## Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Zcash node (testnet or mainnet) or remote RPC endpoint
- Google Gemini API key ([Get one here](https://ai.google.dev/))
- (Optional) NEAR Intents API access for cross-chain swaps

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd zecfinder
```

2. Install dependencies:
```bash
# Backend
cd backend
pnpm install

# Frontend
cd ../frontend
pnpm install
```

3. Configure environment variables:

**Backend** (`.env`):
```env
GEMINI_API_KEY=your_gemini_api_key
ZCASH_RPC_URL=http://localhost:8232
ZCASH_RPC_USER=your_rpc_user
ZCASH_RPC_PASSWORD=your_rpc_password
ZCASH_NETWORK=testnet
PORT=3001
FRONTEND_URL=http://localhost:5173
NEAR_INTENTS_API_URL=https://api.near.org/intents
NEAR_NETWORK=testnet
```

**Frontend** (`.env`):
```env
VITE_API_BASE_URL=http://localhost:3001
```

4. Start the development servers:

```bash
# Terminal 1 - Backend
cd backend
pnpm dev

# Terminal 2 - Frontend
cd frontend
pnpm dev
```

5. Open `http://localhost:5173` in your browser

## Docker Setup

For a complete setup with Zcash testnet node, see [DOCKER_SETUP.md](./DOCKER_SETUP.md) or [QUICK_START.md](./QUICK_START.md).

```bash
# Set your Gemini API key
export GEMINI_API_KEY=your_gemini_api_key

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

Access the application:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Zcash RPC**: http://localhost:18232

## Usage Examples

### Natural Language Commands

```
"Send 0.5 ZEC to zs1..."
"What's my balance?"
"Shield 1 ZEC"
"Swap 0.5 BTC to ZEC"
"Unshield 0.3 ZEC"
```

### API Endpoints

**Chat**
- `POST /api/chat` - Process natural language commands

**Wallet**
- `POST /api/wallet/create` - Create new wallet
- `POST /api/wallet/import` - Import existing wallet
- `GET /api/wallet/balance` - Get wallet balance
- `GET /api/wallet/address` - Get wallet addresses
- `GET /api/wallet/initialization-status` - Check wallet initialization status

**Transaction**
- `POST /api/transaction/evaluate` - Evaluate transaction (no execution)
- `POST /api/transaction/confirm` - Confirm and execute transaction
- `POST /api/transaction/swap` - Execute cross-chain swap
- `GET /api/transaction/swap/:intentId` - Check swap status

## Architecture

### Transaction Flow

1. **User Input**: Natural language command via chat interface
2. **Intent Parsing**: AI agent parses intent using Gemini AI
3. **Transaction Evaluation**: Backend validates and prepares transaction data
4. **User Review**: Transaction details displayed for confirmation
5. **Execution**: Transaction executed via browser wallet or backend
6. **Privacy**: Zero-link routing ensures untraceability

### Privacy Features

- **Zero-Link Routing**: Automatic UTXO selection prevents transaction correlation
- **Shielded Pools**: All sensitive operations use Zcash shielded addresses
- **Cross-Chain Privacy**: Swapped assets automatically enter shielded pools
- **No Logging**: Privacy-first design with minimal data retention

## Integration

### NEAR Protocol
- Cross-chain swap execution via NEAR Intents
- Intent-based architecture for multi-chain operations
- Private receipt of swapped assets

### Gemini Exchange
- Regulated exchange integration for trading
- Secure asset custody
- FCA-compliant operations

### Zcash Community
- Full Zcash protocol support
- Shielded pool integration
- Zero-knowledge proof privacy

## Demo Mode

Enable demo mode to test the application without a Zcash backend:

1. Toggle "Enable Demo Mode" in the wallet manager
2. Use mock wallet data and transaction simulations
3. Test all features without blockchain connection

## Development

### Project Structure

```
zecfinder/
├── backend/          # Express API server
│   ├── src/
│   │   ├── routes/   # API routes
│   │   ├── services/ # Business logic
│   │   └── db/       # Database setup
├── frontend/         # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── app/  # Main app components
│   │   │   ├── landing/ # Landing page
│   │   │   └── ui/   # UI components
│   │   ├── lib/      # Utilities and stores
│   │   └── pages/    # Page components
└── prd.md           # Product requirements
```

### Key Services

- **aiAgent.ts** - Intent parsing with Gemini AI
- **transactionEvaluation.ts** - Transaction validation and preparation
- **executionEngine.ts** - Transaction execution
- **nearIntents.ts** - Cross-chain swap integration
- **zeroLinkRouting.ts** - Privacy routing logic
- **walletToolService.ts** - Wallet operations
- **zcashService.ts** - Zcash RPC integration

## Documentation

- [Quick Start Guide](./QUICK_START.md) - Docker setup and quick start
- [Docker Setup](./DOCKER_SETUP.md) - Detailed Docker configuration
- [Product Requirements](./prd.md) - Full PRD document
- [RPC Endpoint Comparison](./RPC_ENDPOINT_COMPARISON.md) - RPC endpoint options

## License

[Your License Here]

## Contributing

[Contributing Guidelines]

---

**Built for privacy. Built for you.**
