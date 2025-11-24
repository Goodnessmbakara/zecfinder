# Zcash RPC Endpoint Comparison

## The Problem with Public Endpoints

Based on our testing, here's what we found:

### ❌ Public Endpoint Issues

1. **Tatum Gateway** (`https://zcash-testnet.gateway.tatum.io`)
   - ✅ Works for basic queries (`getblockchaininfo`, `getblockcount`)
   - ❌ Rate limits: **5 requests/minute** (HTTP 429 errors)
   - ❌ Missing methods: `getbalance`, `getinfo` not available
   - ❌ Wallet operations fail due to rate limits
   - ⚠️ **Not suitable for production** - too restrictive

2. **Chain49** (`https://rpc.chain49.com/zcash-testnet`)
   - ❌ Complete timeout on all requests
   - ❌ Unreliable connection
   - ❌ **Not usable**

3. **Lightwalletd** (`https://testnet.lightwalletd.com:9067`)
   - ❌ Uses gRPC protocol, not JSON-RPC
   - ❌ Incompatible with our current implementation
   - ❌ **Not usable**

## ✅ Why Self-Hosted (Docker) is Better

### Key Differences

| Feature | Public Endpoints | Self-Hosted Node (Docker) |
|---------|-----------------|---------------------------|
| **Rate Limits** | ❌ Yes (5 req/min) | ✅ No limits |
| **Available Methods** | ⚠️ Limited | ✅ All RPC methods |
| **Reliability** | ⚠️ Shared, unpredictable | ✅ Your own infrastructure |
| **Control** | ❌ None | ✅ Full control |
| **Privacy** | ⚠️ Shared with others | ✅ Your own node |
| **Cost** | 💰 Free (limited) or paid | 💰 Infrastructure costs |
| **Setup Complexity** | ✅ Easy (just URL) | ⚠️ Requires Docker setup |
| **Maintenance** | ✅ None | ⚠️ You maintain it |

### What You Get with Docker

1. **Full RPC Access**: All methods work (`getbalance`, `listunspent`, `z_sendmany`, etc.)
2. **No Rate Limits**: Make as many requests as you need
3. **Reliability**: Your node, your uptime
4. **Privacy**: No shared infrastructure
5. **Control**: Configure exactly how you want

### The Trade-off

- **Public Endpoints**: Easy to start, but unreliable and limited
- **Self-Hosted**: More setup, but reliable and full-featured

## Quick Start: Docker Setup

### 1. Start Zcash Testnet Node

```bash
docker-compose up -d zcash-testnet
```

This will:
- Download the official Zcash Docker image
- Start a testnet node
- Sync the blockchain (takes ~30-60 minutes initially)
- Expose RPC on port `18232`

### 2. Check Node Status

```bash
# Check if node is syncing
docker logs -f zcash-testnet

# Test RPC connection
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","id":1,"method":"getblockchaininfo","params":[]}' \
  http://zcash:zcash123@localhost:18232
```

### 3. Configure Backend

Update your `.env`:

```bash
ZCASH_RPC_URL=http://localhost:18232
ZCASH_RPC_USER=zcash
ZCASH_RPC_PASSWORD=zcash123
ZCASH_NETWORK=testnet
```

### 4. Test All Methods

Run our test script against your local node:

```bash
cd backend
# Temporarily modify test script to test localhost:18232
pnpm tsx scripts/test-rpc-endpoints.ts
```

## Cloud Deployment Options

### Option 1: Docker Compose (Recommended for MVP)

Deploy both Zcash node and backend together:

```bash
# On your cloud server
docker-compose up -d
```

**Pros:**
- Simple deployment
- Both services together
- Easy to manage

**Cons:**
- Both on same server
- Resource sharing

### Option 2: Separate Services

Run Zcash node separately, backend connects via private network:

```yaml
# zcash-node service (separate)
ZCASH_RPC_URL=http://zcash-node.internal:18232

# backend service
depends_on: zcash-node
```

**Pros:**
- Better resource isolation
- Can scale independently
- More production-ready

**Cons:**
- More complex setup
- Requires private networking

### Option 3: Managed Zcash Node Service

Use a paid service that provides reliable RPC:

- **Ankr**: `https://rpc.ankr.com/zcash_testnet`
- **QuickNode**: Custom Zcash endpoints
- **Alchemy**: Check if they support Zcash

**Pros:**
- No infrastructure to manage
- Usually more reliable than free tiers

**Cons:**
- Costs money
- Still rate limited (but higher limits)
- Less control

## Recommendation

For **hackathon/demo**: Use Docker Compose locally or on a cloud VM
- Quick setup
- Full functionality
- No rate limits
- Reliable

For **production**: 
1. Self-hosted node in private network (best control)
2. Or managed service with higher rate limits (easier)

## Testing Your Setup

After setting up Docker, verify everything works:

```bash
# Test script that checks all methods
cd backend
pnpm tsx scripts/test-rpc-endpoints.ts
```

You should see **100% success rate** with your own node! 🎉


