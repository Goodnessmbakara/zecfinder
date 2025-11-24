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

**For Local Development:**
```env
ZCASH_RPC_URL=http://localhost:8232
ZCASH_RPC_USER=your_rpc_user
ZCASH_RPC_PASSWORD=your_rpc_password
ZCASH_NETWORK=testnet
NEAR_INTENTS_API_URL=https://api.near.org/intents
NEAR_NETWORK=testnet
GEMINI_API_KEY=your_gemini_api_key
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**For Cloud Deployment:**
```env
# See CLOUD_DEPLOYMENT.md for detailed cloud setup guide
ZCASH_RPC_URL=http://YOUR_NODE_IP:8232  # Your cloud node IP/domain
ZCASH_RPC_USER=secure_username_from_secrets_manager
ZCASH_RPC_PASSWORD=secure_password_from_secrets_manager
ZCASH_NETWORK=testnet
NEAR_INTENTS_API_URL=https://api.near.org/intents
NEAR_NETWORK=testnet
GEMINI_API_KEY=your_gemini_api_key
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
```

**⚠️ Important:** For cloud deployment, you **must** set up a Zcash node (see Cloud Deployment section below).

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

## Cloud Deployment Guide

### Zcash RPC Configuration for Cloud

When deploying to the cloud, you **cannot** use `localhost:8232`. You have several options:

#### Option 1: Self-Hosted Zcash Node (Recommended for Production)

Deploy your own Zcash node in the cloud:

**AWS/GCP/Azure Setup:**
```bash
# Install Zcash node on cloud instance
# For Ubuntu/Debian:
sudo apt-get update
sudo apt-get install -y zcash

# Configure zcash.conf
rpcuser=your_secure_username
rpcpassword=your_secure_password
rpcbind=0.0.0.0  # Allow external connections
rpcallowip=YOUR_APP_IP/32  # Restrict to your app's IP
server=1
testnet=1  # or 0 for mainnet
```

**Environment Variable:**
```env
ZCASH_RPC_URL=http://YOUR_NODE_IP:8232
# or for HTTPS:
ZCASH_RPC_URL=https://zcash-node.yourdomain.com:8232
ZCASH_RPC_USER=your_secure_username
ZCASH_RPC_PASSWORD=your_secure_password
```

**Security Best Practices:**
- Use strong RPC credentials (long, random passwords)
- Restrict RPC access to your application's IP only (`rpcallowip`)
- Use HTTPS/TLS for RPC connections (set up reverse proxy with nginx)
- Use VPC/private networking when possible
- Enable firewall rules to restrict port 8232 access

#### Option 2: Public RPC Endpoints (For Testing/Development)

**Testnet Public Endpoints:**
```env
# Example testnet endpoints (verify availability before use)
ZCASH_RPC_URL=http://testnet.z.cash:8232
# or
ZCASH_RPC_URL=https://zcash-testnet.example.com:8232
```

**⚠️ Important:** Public endpoints have severe limitations:
- Rate limits (5 requests/minute typical)
- Missing wallet methods (`getbalance`, `listunspent`)
- Unreliable connections and timeouts

**✅ Recommended:** Use Docker to run your own node. See `RPC_ENDPOINT_COMPARISON.md` for detailed analysis and setup guide.

#### Option 3: VPN/Tunnel to Local Node

If you have a Zcash node running locally or on another server:

```bash
# Use SSH tunnel
ssh -L 8232:localhost:8232 user@your-node-server

# Then in your cloud app:
ZCASH_RPC_URL=http://localhost:8232
```

#### Option 4: Docker Container with Zcash Node (✅ Recommended for MVP/Demo)

**Why Docker is Better:**
- ✅ **No rate limits** - Your own node, unlimited requests
- ✅ **All RPC methods work** - Full functionality (getbalance, listunspent, z_sendmany, etc.)
- ✅ **Reliable** - No shared infrastructure issues
- ✅ **Easy setup** - One command to start

We've included a complete Docker setup in the repo. See `docker-compose.yml` and `RPC_ENDPOINT_COMPARISON.md` for details.

**Quick Start:**
```bash
# Start Zcash testnet node
docker-compose up -d zcash-testnet

# Check sync status
docker logs -f zcash-testnet

# Test your node (should see 100% success!)
cd backend
ZCASH_RPC_URL=http://localhost:18232 ZCASH_RPC_USER=zcash ZCASH_RPC_PASSWORD=zcash123 pnpm tsx scripts/test-local-node.ts
```

**Environment Variable:**
```env
# For local Docker
ZCASH_RPC_URL=http://localhost:18232
ZCASH_RPC_USER=zcash
ZCASH_RPC_PASSWORD=zcash123

# For Docker Compose (backend service)
ZCASH_RPC_URL=http://zcash-testnet:18232
```

### Cloud Deployment Checklist

- [ ] Set up Zcash node in cloud (or use public endpoint for testing)
- [ ] Configure RPC credentials securely
- [ ] Set `ZCASH_RPC_URL` to your node's public IP or domain
- [ ] Restrict RPC access via firewall/VPC rules
- [ ] Use HTTPS/TLS for RPC connections (recommended)
- [ ] Store RPC credentials in secure environment variables/secrets manager
- [ ] Test RPC connection before deploying application
- [ ] Monitor node sync status
- [ ] Set up node monitoring and alerts

### Environment Variables for Cloud

```env
# Production Cloud Configuration
ZCASH_RPC_URL=https://zcash-node.yourdomain.com:8232
ZCASH_RPC_USER=secure_username_from_secrets_manager
ZCASH_RPC_PASSWORD=secure_password_from_secrets_manager
ZCASH_NETWORK=testnet  # or mainnet

# Use secrets manager (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault)
# Never hardcode credentials in code or environment files
```

### Security Recommendations

1. **Never expose RPC without authentication** - Always use `rpcuser` and `rpcpassword`
2. **Use IP whitelisting** - Restrict `rpcallowip` to your application servers only
3. **Use HTTPS** - Set up nginx/Traefik reverse proxy with SSL certificates
4. **Store credentials securely** - Use cloud secrets managers, not environment files
5. **Monitor access** - Log all RPC calls and monitor for suspicious activity
6. **Use VPC/Private Networking** - Keep RPC communication within private network when possible

## Troubleshooting

### Zcash RPC Connection Issues
- Verify Zcash node is running
- Check RPC credentials
- Ensure network matches (testnet/mainnet)
- **For cloud:** Verify firewall rules allow connections from your app
- **For cloud:** Check if node is accessible from your application's network
- **For cloud:** Verify DNS resolution if using domain name

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

