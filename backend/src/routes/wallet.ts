import express from "express"
import { createWallet, importWallet, getBalance, initializeZcash, getWalletAddress } from "../services/zcashService.js"

const router = express.Router()

// Initialize Zcash on server start
initializeZcash({
  rpcUrl: process.env.ZCASH_RPC_URL || "http://localhost:8232",
  rpcUser: process.env.ZCASH_RPC_USER,
  rpcPassword: process.env.ZCASH_RPC_PASSWORD,
  network: (process.env.ZCASH_NETWORK as "mainnet" | "testnet") || "testnet"
})

router.post("/create", async (req, res) => {
  try {
    const wallet = await createWallet()
    res.json({
      address: wallet.address,
      mnemonic: wallet.mnemonic,
      // Never send private key to frontend in production
      // This is for MVP testing only
      privateKey: wallet.privateKey
    })
  } catch (error) {
    console.error("Create wallet error:", error)
    res.status(500).json({
      error: "Failed to create wallet",
      message: error instanceof Error ? error.message : "Unknown error"
    })
  }
})

router.post("/import", async (req, res) => {
  try {
    const { mnemonic } = req.body

    if (!mnemonic || typeof mnemonic !== "string") {
      return res.status(400).json({ error: "Mnemonic is required" })
    }

    const wallet = await importWallet(mnemonic)
    res.json({
      address: wallet.address,
      // Never send private key to frontend in production
      privateKey: wallet.privateKey
    })
  } catch (error) {
    console.error("Import wallet error:", error)
    res.status(500).json({
      error: "Failed to import wallet",
      message: error instanceof Error ? error.message : "Unknown error"
    })
  }
})

router.get("/balance", async (req, res) => {
  try {
    const walletAddress = getWalletAddress()
    if (!walletAddress) {
      return res.status(404).json({ error: "Wallet not initialized" })
    }

    const walletInfo = await getBalance()
    res.json(walletInfo)
  } catch (error) {
    console.error("Get balance error:", error)
    res.status(500).json({
      error: "Failed to get balance",
      message: error instanceof Error ? error.message : "Unknown error"
    })
  }
})

router.get("/address", async (req, res) => {
  try {
    const address = getWalletAddress()
    if (!address) {
      return res.status(404).json({ error: "Wallet not initialized" })
    }
    res.json({ address })
  } catch (error) {
    console.error("Get address error:", error)
    res.status(500).json({
      error: "Failed to get address",
      message: error instanceof Error ? error.message : "Unknown error"
    })
  }
})

export default router

