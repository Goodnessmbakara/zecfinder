import express, { Router } from "express"
import { createWallet, getBalance, shieldTransaction, getZcashConfig, sendTransaction, backupWallet, initializeZcash, checkWalletInitialization, canCreateWallet } from '../services/zcashService.js';
import { getUser, createUser } from "../db/database.js"
import { startWalletToolAcknowledgment, sendWalletToolResponse, getCurrentPrompt, getSessionStatus, cleanupSession } from '../services/walletToolService.js';
import { v4 as uuidv4 } from 'uuid';

const router: Router = express.Router()

// Initialize Zcash on server start
const network = (process.env.ZCASH_NETWORK as "mainnet" | "testnet") || "testnet"
// Default ports: testnet uses 18232, mainnet uses 8232
const defaultPort = network === "testnet" ? "18232" : "8232"
initializeZcash({
  rpcUrl: process.env.ZCASH_RPC_URL || `http://localhost:${defaultPort}`,
  rpcUser: process.env.ZCASH_RPC_USER,
  rpcPassword: process.env.ZCASH_RPC_PASSWORD,
  network
})
console.log(`Zcash initialized: network=${network}, RPC=${process.env.ZCASH_RPC_URL || `http://localhost:${defaultPort}`}`)

// Check wallet initialization status
router.get("/initialization-status", async (req, res) => {
  try {
    const status = await checkWalletInitialization()
    res.json(status)
  } catch (error) {
    console.error("Initialization status check error:", error)
    res.status(500).json({ 
      initialized: false, 
      error: error instanceof Error ? error.message : String(error) 
    })
  }
})

// Login or Register
router.post("/login", async (req, res) => {
  try {
    const { username } = req.body
    if (!username) return res.status(400).json({ error: "Username required" })

    // Check if wallet is initialized before attempting to create new wallets
    const canCreate = await canCreateWallet()
    if (!canCreate) {
      const initStatus = await checkWalletInitialization()
      return res.status(503).json({ 
        error: "Wallet not initialized", 
        details: initStatus.error || "Wallet requires initialization before use",
        requiresInitialization: true
      })
    }

    let user = await getUser(username)
    if (!user) {
      console.log(`Creating new wallet for user: ${username}`)
      try {
        // Create new wallet
        const wallet = await createWallet()
        user = await createUser(username, wallet.address, wallet.privateKey, wallet.shieldedAddress)
      } catch (createError) {
        const errorMessage = createError instanceof Error ? createError.message : String(createError)
        // Check if error is related to backup/initialization
        if (errorMessage.includes("acknowledge") || errorMessage.includes("backed up") || errorMessage.includes("exportdir")) {
          const initStatus = await checkWalletInitialization()
          return res.status(503).json({ 
            error: "Wallet not initialized", 
            details: initStatus.error || errorMessage,
            requiresInitialization: true
          })
        }
        throw createError
      }
    } else {
        console.log(`User logged in: ${username}`)
    }

    res.json({
      username: user.username,
      address: user.wallet_address,
      shieldedAddress: user.shielded_address
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Login failed", details: error instanceof Error ? error.message : String(error) })
  }
})

// Get Balance
router.get("/balance", async (req, res) => {
  try {
    const { username } = req.query
    if (!username || typeof username !== 'string') return res.status(400).json({ error: "Username required" })

    const user = await getUser(username)
    if (!user) return res.status(404).json({ error: "User not found" })

    const balance = await getBalance(user.wallet_address, user.shielded_address)
    // Include network info for currency display
    res.json({
      ...balance,
      network: network // testnet or mainnet
    })
  } catch (error) {
    console.error("Balance error:", error)
    res.status(500).json({ error: "Failed to get balance" })
  }
})

// Shield Funds
router.post("/shield", async (req, res) => {
  try {
    const { username, amount } = req.body
    if (!username || !amount) return res.status(400).json({ error: "Username and amount required" })

    const user = await getUser(username)
    if (!user) return res.status(404).json({ error: "User not found" })

    if (!user.shielded_address) return res.status(400).json({ error: "User has no shielded address" })

    const opId = await shieldTransaction(user.wallet_address, user.shielded_address, parseFloat(amount))
    res.json({ operationId: opId })
  } catch (error) {
    console.error("Shield error:", error)
    res.status(500).json({ error: "Shielding failed" })
  }
})

// Airdrop Info
router.post("/airdrop", async (req, res) => {
    res.json({
        message: "To get testnet ZEC, please visit a Zcash Testnet Faucet.",
        faucetUrl: "https://testnet.zecfaucet.com/" 
    })
})

// Start interactive wallet backup acknowledgment
router.post('/backup/start', async (req, res) => {
  try {
    const sessionId = uuidv4();
    const prompts = startWalletToolAcknowledgment(sessionId);
    
    res.json({
      sessionId,
      prompts,
      message: 'Wallet backup acknowledgment started'
    });
  } catch (error) {
    console.error('Failed to start backup acknowledgment:', error);
    res.status(500).json({
      error: 'Failed to start backup acknowledgment',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get current prompt/status
router.get('/backup/status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const prompt = getCurrentPrompt(sessionId);
    const status = getSessionStatus(sessionId);
    
    res.json({
      prompt,
      status
    });
  } catch (error) {
    console.error('Failed to get backup status:', error);
    res.status(500).json({
      error: 'Failed to get backup status',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Send response to wallet tool
router.post('/backup/respond/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { response } = req.body;
    
    if (!response) {
      return res.status(400).json({ error: 'Response is required' });
    }
    
    const prompt = sendWalletToolResponse(sessionId, response);
    const status = getSessionStatus(sessionId);
    
    res.json({
      prompt,
      status
    });
  } catch (error) {
    console.error('Failed to send response:', error);
    res.status(500).json({
      error: 'Failed to send response',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Cleanup session
router.delete('/backup/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    cleanupSession(sessionId);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to cleanup session:', error);
    res.status(500).json({
      error: 'Failed to cleanup session',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

router.post('/backup', async (req, res) => {
  try {
    // Verify initialization status before backup
    const initStatus = await checkWalletInitialization()
    
    // If already initialized, backup is not needed, but we can still do it
    const filename = await backupWallet();
    res.json({ 
      success: true, 
      filename,
      message: 'Wallet backup created successfully. Wallet is now initialized.'
    });
  } catch (error) {
    console.error('Backup error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // Check for specific error types
    if (errorMessage.includes("exportdir") || errorMessage.includes("export-dir")) {
      res.status(503).json({ 
        error: 'Backup directory not configured', 
        details: 'The Zcash node requires -exportdir to be configured. Please contact the administrator.',
        requiresConfiguration: true
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to backup wallet', 
        details: errorMessage 
      });
    }
  }
});

export default router
