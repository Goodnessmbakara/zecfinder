# Quick Start Guide

## Prerequisites

- Docker and Docker Compose installed
- Google Gemini API key ([Get one here](https://ai.google.dev/))
- At least 20GB free disk space (for Zcash testnet blockchain)

## Setup

1. **Set your Gemini API key:**
   ```bash
   export GEMINI_API_KEY=your_gemini_api_key_here
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - Zcash testnet node (syncing blockchain)
   - Backend API server (waits for Zcash node)
   - Frontend web app (waits for backend to be healthy)

3. **Check service status:**
   ```bash
   docker-compose ps
   ```

4. **View logs:**
   ```bash
   # All services
   docker-compose logs -f
   
   # Specific service
   docker-compose logs -f backend
   docker-compose logs -f frontend
   docker-compose logs -f zcash-testnet
   ```

## Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Zcash RPC**: http://localhost:18232

## Service Startup Order

1. **zcash-testnet** starts first (no dependencies)
2. **backend** waits for zcash-testnet, then starts and becomes healthy
3. **frontend** waits for backend to be healthy, then starts

## Initial Sync

The Zcash testnet node needs to sync the blockchain (takes 30-60 minutes). You can monitor progress:

```bash
docker logs -f zcash-testnet-node | grep -E "(Block|height|progress)"
```

Once synced, you'll see the node is ready and all wallet operations will work.

## Testing

Test the backend health:
```bash
curl http://localhost:3001/health
```

Test Zcash RPC:
```bash
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","id":1,"method":"getblockchaininfo","params":[]}' \
  http://zcash:zcash123@localhost:18232
```

## Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes blockchain data)
docker-compose down -v
```

## Troubleshooting

### Backend won't start
- Check if GEMINI_API_KEY is set: `echo $GEMINI_API_KEY`
- Check backend logs: `docker-compose logs backend`

### Frontend won't start
- Check if backend is healthy: `docker-compose ps`
- Check frontend logs: `docker-compose logs frontend`

### Zcash node issues
- Check if node is syncing: `docker logs zcash-testnet-node`
- Wait for initial sync to complete (can take 30-60 minutes)

## Environment Variables

Create a `.env` file in the project root (optional):

```env
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:5173
```

## Production Notes

For production deployment:
- Change default RPC credentials (zcash/zcash123)
- Use strong passwords
- Set up proper networking and security
- Configure HTTPS/TLS
- Use secrets management for API keys





