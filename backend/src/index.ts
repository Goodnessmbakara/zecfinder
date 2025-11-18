import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import chatRoutes from "./routes/chat.js"
import walletRoutes from "./routes/wallet.js"
import transactionRoutes from "./routes/transaction.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}))
app.use(express.json())

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// API Routes
app.use("/api/chat", chatRoutes)
app.use("/api/wallet", walletRoutes)
app.use("/api/transaction", transactionRoutes)

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err)
  res.status(500).json({ error: "Internal server error", message: err.message })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Frontend URL: ${FRONTEND_URL}`)
})

