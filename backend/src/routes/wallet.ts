import express, { Router } from "express"
import { createWallet, getBalance, initializeZcash, shieldTransaction } from "../services/zcashService.js"
import { getUser, createUser } from "../db/database.js"

const router: Router = express.Router()

// Initialize Zcash on server start
initializeZcash({
  rpcUrl: process.env.ZCASH_RPC_URL || "http://localhost:8232",
  rpcUser: process.env.ZCASH_RPC_USER,
  rpcPassword: process.env.ZCASH_RPC_PASSWORD,
  network: (process.env.ZCASH_NETWORK as "mainnet" | "testnet") || "testnet"
})

// Login or Register
router.post("/login", async (req, res) => {
  try {
    const { username } = req.body
    if (!username) return res.status(400).json({ error: "Username required" })

    let user = await getUser(username)
    if (!user) {
      console.log(`Creating new wallet for user: ${username}`)
      // Create new wallet
      const wallet = await createWallet()
      user = await createUser(username, wallet.address, wallet.privateKey, wallet.shieldedAddress)
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
    res.json(balance)
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
        faucetUrl: "https://faucet.zecpages.com/" 
    })
})

export default router

