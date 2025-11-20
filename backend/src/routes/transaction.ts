import express, { Router } from "express"
import { sendTransaction, shieldTransaction, unshieldTransaction } from "../services/zcashService.js"
import { executeIntent } from "../services/executionEngine.js"
import { ParsedIntent } from "../services/aiAgent.js"
import { createSwapIntent, checkIntentStatus, getIntentResult } from "../services/nearIntents.js"

const router: Router = express.Router()

router.post("/send", async (req, res) => {
  try {
    const { toAddress, amount, isPrivate } = req.body

    if (!toAddress || typeof toAddress !== "string") {
      return res.status(400).json({ error: "Recipient address is required" })
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "Valid amount is required" })
    }

    const txid = await sendTransaction(toAddress, amount, isPrivate || false)

    res.json({
      success: true,
      txid,
      message: isPrivate
        ? "Private transaction sent successfully"
        : "Transaction sent successfully"
    })
  } catch (error) {
    console.error("Send transaction error:", error)
    res.status(500).json({
      error: "Failed to send transaction",
      message: error instanceof Error ? error.message : "Unknown error"
    })
  }
})

router.post("/confirm", async (req, res) => {
  try {
    const { intent, confirmed } = req.body

    if (!intent || typeof intent !== "object") {
      return res.status(400).json({ error: "Intent is required" })
    }

    if (confirmed !== true) {
      return res.status(400).json({ error: "Transaction not confirmed" })
    }

    // Execute the intent
    const execution = await executeIntent(intent as ParsedIntent)

    res.json({
      success: execution.success,
      status: execution.status,
      txid: execution.txid,
      operationId: execution.operationId,
      privacyLevel: execution.privacyLevel,
      message: execution.message,
      error: execution.error
    })
  } catch (error) {
    console.error("Confirm transaction error:", error)
    res.status(500).json({
      error: "Failed to confirm transaction",
      message: error instanceof Error ? error.message : "Unknown error"
    })
  }
})

router.post("/swap", async (req, res) => {
  try {
    const { fromAsset, toAsset, amount, recipient } = req.body

    if (!fromAsset || !toAsset) {
      return res.status(400).json({ error: "Source and destination assets are required" })
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "Valid amount is required" })
    }

    const intentId = await createSwapIntent({
      fromAsset: fromAsset.toUpperCase(),
      toAsset: toAsset.toUpperCase(),
      amount,
      recipient
    })

    res.json({
      success: true,
      intentId,
      message: `Swap intent created. ID: ${intentId}`
    })
  } catch (error) {
    console.error("Swap transaction error:", error)
    res.status(500).json({
      error: "Failed to create swap intent",
      message: error instanceof Error ? error.message : "Unknown error"
    })
  }
})

router.get("/swap/:intentId", async (req, res) => {
  try {
    const { intentId } = req.params

    const status = await checkIntentStatus(intentId)
    res.json(status)
  } catch (error) {
    console.error("Check swap status error:", error)
    res.status(500).json({
      error: "Failed to check swap status",
      message: error instanceof Error ? error.message : "Unknown error"
    })
  }
})

router.get("/swap/:intentId/result", async (req, res) => {
  try {
    const { intentId } = req.params

    const result = await getIntentResult(intentId)
    res.json(result)
  } catch (error) {
    console.error("Get swap result error:", error)
    res.status(500).json({
      error: "Failed to get swap result",
      message: error instanceof Error ? error.message : "Unknown error"
    })
  }
})

export default router

