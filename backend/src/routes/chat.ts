import express from "express"
import { parseIntent, generateResponse } from "../services/aiAgent.js"
import { getBalance, getWalletAddress } from "../services/zcashService.js"

const router = express.Router()

router.post("/", async (req, res) => {
  try {
    const { message } = req.body

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" })
    }

    // Parse user intent
    const intent = await parseIntent(message)

    // Get wallet context if available
    let context: { balance?: number; address?: string } = {}
    try {
      const walletAddress = getWalletAddress()
      if (walletAddress) {
        const walletInfo = await getBalance()
        context = {
          balance: walletInfo.balance,
          address: walletInfo.address
        }
      }
    } catch (error) {
      // Wallet not initialized, continue without context
    }

    // Generate AI response
    const response = await generateResponse(intent, context)

    res.json({
      response,
      intent,
      context
    })
  } catch (error) {
    console.error("Chat error:", error)
    res.status(500).json({
      error: "Failed to process chat message",
      message: error instanceof Error ? error.message : "Unknown error"
    })
  }
})

export default router

