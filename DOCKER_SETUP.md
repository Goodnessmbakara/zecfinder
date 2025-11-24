# Docker Setup Guide for ZecFinder

## Quick Start

### 1. Prerequisites

- Docker and Docker Compose installed
- At least 20GB free disk space (for testnet blockchain)
- 4GB+ RAM recommended

### 2. Start Zcash Testnet Node

```bash
# Start only the Zcash node (recommended for first time)
docker-compose up -d zcash-testnet

# Check logs to see sync progress
docker logs -f zcash-testnet
```

**Initial sync takes 30-60 minutes** for testnet. You'll see messages like:
```
Loading block index...
Verifying blocks...
```

### 3. Verify Node is Working

Once you see "Block height: XXXX" in the logs, test the RPC:

```bash
# Test RPC connection
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","id":1,"method":"getblockchaininfo","params":[]}' \
  http://zcash:zcash123@localhost:18232

# Or use our test script
cd backend
ZCASH_RPC_URL=http://localhost:18232 ZCASH_RPC_USER=zcash ZCASH_RPC_PASSWORD=zcash123 pnpm tsx scripts/test-local-node.ts
```

### 4. Start Backend (Optional)

Once the Zcash node is synced, you can start the backend:

```bash
# Start both services
docker-compose up -d

# Or start backend separately
docker-compose up -d backend
```

### 5. Check Status

```bash
# Check all services
docker-compose ps

# Check Zcash node logs
docker logs zcash-testnet

# Check backend logs
docker logs zecfinder-backend
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Zcash RPC (for local Docker)
ZCASH_RPC_URL=http://localhost:18232
ZCASH_RPC_USER=zcash
ZCASH_RPC_PASSWORD=zcash123
ZCASH_NETWORK=testnet

# Gemini AI (required for AI agent)
GEMINI_API_KEY=your_gemini_api_key

# Backend
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### RPC Credentials

Default credentials in docker-compose.yml:
- User: `zcash`
- Password: `zcash123`

**⚠️ For production, change these!** Update in docker-compose.yml and your `.env` file.

## Troubleshooting

### Node Not Syncing

```bash
# Check if node is running
docker ps | grep zcash

# Check logs for errors
docker logs zcash-testnet

# Restart if needed
docker-compose restart zcash-testnet
```

### RPC Connection Failed

1. **Check if node is ready:**
   ```bash
   docker logs zcash-testnet | grep -i "ready\|synced\|block"
   ```

2. **Test RPC directly:**
   ```bash
   curl -X POST -H "Content-Type: application/json" \
     --data '{"jsonrpc":"2.0","id":1,"method":"getblockcount","params":[]}' \
     http://zcash:zcash123@localhost:18232
   ```

3. **Check port is exposed:**
   ```bash
   docker port zcash-testnet
   # Should show: 18232/tcp -> 0.0.0.0:18232
   ```

### Out of Disk Space

Blockchain data grows over time. Check usage:

```bash
# Check Docker volume sizes
docker system df -v | grep zcash

# Clean up if needed (⚠️ deletes blockchain data)
docker-compose down -v
```

### Backend Can't Connect

If backend is in Docker, it should use service name:
```env
ZCASH_RPC_URL=http://zcash-testnet:18232
```

If backend is local, use:
```env
ZCASH_RPC_URL=http://localhost:18232
```

## Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes blockchain data)
docker-compose down -v

# Stop only Zcash node
docker-compose stop zcash-testnet
```

## Production Considerations

1. **Change RPC credentials** - Use strong passwords
2. **Use private networking** - Don't expose RPC port publicly
3. **Set resource limits** - Add to docker-compose.yml:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '2'
         memory: 4G
   ```
4. **Backup blockchain data** - The `zcash-data` volume contains your synced blockchain
5. **Monitor disk usage** - Blockchain grows continuously

## Why Docker is Better

✅ **No rate limits** - Your own node, unlimited requests  
✅ **All RPC methods** - Full functionality (getbalance, listunspent, z_sendmany, etc.)  
✅ **Reliable** - No shared infrastructure issues  
✅ **Private** - Your own node, your data  
✅ **Control** - Configure exactly how you want

Compare to public endpoints:
- ❌ 5 requests/minute limit
- ❌ Missing wallet methods
- ❌ Unreliable connections
- ❌ Shared with others
