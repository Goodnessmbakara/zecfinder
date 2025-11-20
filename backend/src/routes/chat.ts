import express, { Router } from "express"
import { parseIntent, generateResponse } from "../services/aiAgent.js"
import { getBalance, getWalletAddress } from "../services/zcashService.js"
import { executeIntent } from "../services/executionEngine.js"

const router: Router = express.Router()

router.post("/", async (req, res) => {
  try {
    const { message } = req.body

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" })
    }

    // Parse user intent
    const intent = await parseIntent(message)

    // Get wallet context if available
    let context: { balance?: number; address?: string; error?: string } = {}
    try {
      const walletAddress = getWalletAddress()
      if (walletAddress) {
        const walletInfo = await getBalance()
        context = {
          balance: walletInfo.balance + (walletInfo.shieldedBalance || 0),
          address: walletInfo.address
        }
      }
    } catch (error) {
      // Wallet not initialized, continue without context
      context.error = error instanceof Error ? error.message : "Wallet not initialized"
    }

    // Check if action requires execution
    const requiresExecution = ["send", "shield", "unshield"].includes(intent.action)
    let execution = undefined

    if (requiresExecution) {
      try {
        // Execute the intent
        execution = await executeIntent(intent)
        
        // Update context with execution result for AI response
        if (execution.error) {
          context.error = execution.error
        }
      } catch (error) {
        execution = {
          success: false,
          status: "failed" as const,
          privacyLevel: "transparent" as const,
          message: error instanceof Error ? error.message : "Execution failed",
          error: error instanceof Error ? error.message : "Unknown error"
        }
        context.error = execution.error
      }
    }

    // Generate AI response (with execution context if available)
    const response = await generateResponse(intent, context)

    res.json({
      response,
      intent,
      context,
      execution
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

