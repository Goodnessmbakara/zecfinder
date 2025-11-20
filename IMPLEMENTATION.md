# ZecFinder Implementation Documentation

## Overview

ZecFinder is a privacy-preserving, autonomous agent wallet for Zcash that discovers, routes, and executes user intents without exposing identity or transaction linkage. The system combines stealth, precision, and automation to allow users to find privacy, execute actions, and remain untraceable.

## Architecture

```
[User UI] 
    ↓
[Chat Interface] 
    ↓
[AI Intent Parser] 
    ↓
[Execution Engine] 
    ↓
[Zero-Link Routing] ──→ [Zcash Service] ──→ [Zcash Node]
    ↓
[NEAR Intents Service] ──→ [NEAR Intents API] ──→ [Cross-Chain Bridge]
    ↓
[Transaction Status] ──→ [Feedback UI]
```

## Key Features

### 1. Zero-Link Routing
- UTXO selection algorithm that minimizes traceability
- Age diversity: Mixes old and new UTXOs
- Amount randomization: Avoids predictable patterns
- Input count optimization: Uses multiple small UTXOs when possible

### 2. Shielded Pool Integration
- Shield transactions: Transfer from transparent (t-address) to shielded (z-address)
- Unshield transactions: Transfer from shielded (z-address) to transparent (t-address)
- Automatic shielded address management
- Real-time balance tracking (transparent + shielded)

### 3. NEAR Intents Integration
- Cross-chain swap support (BTC, SOL, USDC → ZEC)
- Intent-based transaction execution
- Automatic status polling
- Optional auto-shielding of received ZEC

### 4. Intent Execution Engine
- Natural language command parsing
- Automatic transaction execution
- Privacy-aware routing
- Transaction confirmation flow

## Setup Instructions

### Prerequisites
- Node.js 18+
- pnpm
- Zcash testnet node (or mainnet node)
- OpenAI API key (for intent parsing)
- NEAR Intents API access

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
pnpm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Configure environment variables:
```env
ZCASH_RPC_URL=http://localhost:8232
ZCASH_RPC_USER=your_rpc_user
ZCASH_RPC_PASSWORD=your_rpc_password
ZCASH_NETWORK=testnet
NEAR_INTENTS_API_URL=https://api.near.org/intents
NEAR_NETWORK=testnet
OPENAI_API_KEY=your_openai_api_key
PORT=3001
FRONTEND_URL=http://localhost:5173
```

5. Start the backend server:
```bash
pnpm dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
pnpm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:3001
VITE_ZCASH_NETWORK=testnet
```

4. Start the development server:
```bash
pnpm dev
```

## API Endpoints

### Chat API
- `POST /api/chat` - Process natural language commands and execute intents

### Wallet API
- `POST /api/wallet/create` - Create a new wallet
- `POST /api/wallet/import` - Import wallet from mnemonic
- `GET /api/wallet/balance` - Get wallet balance (transparent + shielded)
- `GET /api/wallet/address` - Get wallet address

### Transaction API
- `POST /api/transaction/send` - Send transaction
- `POST /api/transaction/confirm` - Confirm and execute transaction
- `POST /api/transaction/swap` - Create cross-chain swap intent
- `GET /api/transaction/swap/:intentId` - Check swap status
- `GET /api/transaction/swap/:intentId/result` - Get swap result

## Usage Examples

### Shield Transaction
```
User: "Shield 0.1 ZEC"
→ System creates shielded transaction
→ Returns operation ID
→ User can check status
```

### Send with Zero-Link Routing
```
User: "Send 0.05 ZEC to t1abc123... privately"
→ System uses zero-link routing algorithm
→ Selects diverse UTXOs
→ Executes transaction
→ Returns TXID with privacy level
```

### Cross-Chain Swap
```
User: "Swap 0.01 BTC to ZEC"
→ System creates NEAR Intent
→ Monitors swap execution
→ Optionally auto-shields received ZEC
→ Returns transaction hash
```

## Zero-Link Routing Algorithm

The zero-link routing algorithm selects UTXOs to minimize traceability:

1. **Scoring**: Each UTXO is scored based on:
   - Age diversity (mix of confirmations)
   - Recent usage (avoid recently used UTXOs)
   - Amount diversity (avoid round numbers)
   - Confirmation count (prefer well-confirmed)

2. **Selection**: UTXOs are selected to:
   - Sum to required amount + fees
   - Maximize diversity
   - Avoid patterns

3. **Randomization**: Selected UTXOs are randomized to prevent pattern analysis

## Privacy Levels

- **Transparent**: Standard transparent transaction (t-address to t-address)
- **Shielded**: Shielded pool transaction (z-address involved)
- **Zero-Link**: Transparent transaction with zero-link routing algorithm

## Testing

### Testnet Setup
1. Connect to Zcash testnet node
2. Get testnet ZEC from faucet
3. Test shield/unshield operations
4. Test zero-link routing with multiple UTXOs
5. Test cross-chain swaps (if available on testnet)

### End-to-End Testing
1. Create wallet
2. Parse natural language intent
3. Execute transaction
4. Verify transaction on block explorer
5. Check privacy indicators in UI

## Demo Script

See `DEMO_SCRIPT.md` for detailed demo flow.

## Troubleshooting

### Zcash RPC Connection Issues
- Verify Zcash node is running
- Check RPC credentials
- Ensure network matches (testnet/mainnet)

### Shielded Transaction Failures
- Verify wallet has sufficient balance
- Check shielded address exists
- Ensure node is fully synced

### NEAR Intents API Issues
- Verify API URL is correct
- Check network configuration
- Ensure API key is valid (if required)

## Security Considerations

- Private keys are stored in memory only (not persisted)
- Shielded addresses are managed server-side
- Transaction confirmation required before execution
- All RPC calls use authentication
- Error messages don't expose sensitive information

## Future Enhancements

- MPC-backed wallet signing
- Recurring actions/scheduled transactions
- Enhanced privacy scoring
- Multi-chain balance aggregation
- Advanced zero-link routing strategies

