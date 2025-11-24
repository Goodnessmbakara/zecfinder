// IMPORTANT: Load .env file FIRST, before any other imports that might use environment variables
import dotenv from "dotenv"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env file from the project root (two levels up from dist/)
const envPath = join(__dirname, "..", "..", ".env")
console.log(`[DEBUG] Loading .env from: ${envPath}`)
dotenv.config({ path: envPath })

// Now import other modules (they can safely use environment variables)
import express from "express"
import cors from "cors"
import chatRoutes from "./routes/chat.js"
import walletRoutes from "./routes/wallet.js"
import transactionRoutes from "./routes/transaction.js"

// Log environment variable status (without exposing values)
console.log("Environment variables loaded:")
console.log(`- GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? "✓ Set" : "✗ Missing"}`)
console.log(`- ZCASH_RPC_URL: ${process.env.ZCASH_RPC_URL ? "✓ Set" : "✗ Missing (using default)"}`)
console.log(`- PORT: ${process.env.PORT || "3001 (default)"}`)

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

