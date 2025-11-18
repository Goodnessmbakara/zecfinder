import express from "express"
import { sendTransaction } from "../services/zcashService.js"

const router = express.Router()

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

export default router

