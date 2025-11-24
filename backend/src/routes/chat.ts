import express, { Router } from "express"
import { parseIntent, generateResponse, AIAgentError } from "../services/aiAgent.js"
import { getBalance, getWalletAddress } from "../services/zcashService.js"
import { executeIntent } from "../services/executionEngine.js"

const router: Router = express.Router()

router.post("/", async (req, res) => {
  try {
    const { message, history } = req.body

    if (!message || typeof message !== "string") {
      return res.status(400).json({ 
        error: "Message is required",
        errorType: "validation",
        message: "Please provide a valid message"
      })
    }

    if (message.trim().length === 0) {
      return res.status(400).json({ 
        error: "Message cannot be empty",
        errorType: "validation",
        message: "Please enter a message"
      })
    }

    // Validate history format if provided
    let conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
    if (history && Array.isArray(history)) {
      conversationHistory = history.filter((msg: any) => 
        msg && 
        typeof msg === "object" && 
        (msg.role === "user" || msg.role === "assistant") &&
        typeof msg.content === "string"
      ).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    }

    // Parse user intent
    let intent
    try {
      intent = await parseIntent(message)
    } catch (error) {
      if (error instanceof AIAgentError) {
        console.error(`[chat] Intent parsing failed (${error.type}):`, error.message)
        return res.status(500).json({
          error: error.message,
          errorType: error.type,
          message: error.message,
          intent: {
            action: "unknown",
            originalCommand: message
          }
        })
      }
      throw error
    }

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
    const requiresExecution = ["send", "shield", "unshield", "swap"].includes(intent.action)
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

    // Generate AI response (with execution context and conversation history if available)
    let response: string
    try {
      response = await generateResponse(intent, context, conversationHistory)
    } catch (error) {
      if (error instanceof AIAgentError) {
        console.error(`[chat] Response generation failed (${error.type}):`, error.message)
        return res.status(500).json({
          error: error.message,
          errorType: error.type,
          message: error.message,
          intent,
          context,
          execution
        })
      }
      throw error
    }

    res.json({
      response,
      intent,
      context,
      execution
    })
  } catch (error) {
    console.error("[chat] Unexpected error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    res.status(500).json({
      error: "Failed to process chat message",
      errorType: "unknown",
      message: errorMessage,
      details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined
    })
  }
})

export default router

