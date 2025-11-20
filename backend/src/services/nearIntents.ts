import axios from "axios"

const NEAR_INTENTS_API = process.env.NEAR_INTENTS_API_URL || "https://api.near.org/intents"

export interface SwapIntent {
  fromAsset: string // e.g., "BTC", "SOL", "USDC"
  toAsset: string // e.g., "ZEC"
  amount: number
  recipient?: string // Zcash address to receive swapped ZEC
}

export interface IntentStatus {
  id: string
  status: "pending" | "executing" | "completed" | "failed"
  createdAt: string
  updatedAt: string
}

export interface IntentResult {
  id: string
  status: "completed" | "failed"
  txHash?: string
  amount?: number
  recipient?: string
  error?: string
}

/**
 * Create a cross-chain swap intent via NEAR Intents API
 */
export async function createSwapIntent(intentData: SwapIntent): Promise<string> {
  try {
    const response = await axios.post(`${NEAR_INTENTS_API}/intents`, {
      type: "swap",
      from: intentData.fromAsset,
      to: intentData.toAsset,
      amount: intentData.amount,
      recipient: intentData.recipient,
      network: process.env.NEAR_NETWORK || "testnet"
    }, {
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (response.data && response.data.id) {
      return response.data.id
    }

    throw new Error("Invalid response from NEAR Intents API")
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message
      throw new Error(`Failed to create swap intent: ${message}`)
    }
    throw new Error(`Failed to create swap intent: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Check the status of an intent
 */
export async function checkIntentStatus(intentId: string): Promise<IntentStatus> {
  try {
    const response = await axios.get(`${NEAR_INTENTS_API}/intents/${intentId}`, {
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (response.data) {
      return {
        id: response.data.id || intentId,
        status: response.data.status || "pending",
        createdAt: response.data.createdAt || new Date().toISOString(),
        updatedAt: response.data.updatedAt || new Date().toISOString()
      }
    }

    throw new Error("Invalid response from NEAR Intents API")
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message
      throw new Error(`Failed to check intent status: ${message}`)
    }
    throw new Error(`Failed to check intent status: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Get the result of a completed intent
 */
export async function getIntentResult(intentId: string): Promise<IntentResult> {
  try {
    const response = await axios.get(`${NEAR_INTENTS_API}/intents/${intentId}/result`, {
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (response.data) {
      return {
        id: response.data.id || intentId,
        status: response.data.status || "completed",
        txHash: response.data.txHash,
        amount: response.data.amount,
        recipient: response.data.recipient,
        error: response.data.error
      }
    }

    throw new Error("Invalid response from NEAR Intents API")
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message
      throw new Error(`Failed to get intent result: ${message}`)
    }
    throw new Error(`Failed to get intent result: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Poll intent status until completion or timeout
 */
export async function waitForIntentCompletion(
  intentId: string,
  timeoutMs: number = 300000, // 5 minutes default
  pollIntervalMs: number = 5000 // 5 seconds
): Promise<IntentResult> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    try {
      const status = await checkIntentStatus(intentId)

      if (status.status === "completed") {
        return await getIntentResult(intentId)
      }

      if (status.status === "failed") {
        const result = await getIntentResult(intentId)
        throw new Error(result.error || "Intent execution failed")
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
    } catch (error) {
      // If it's a completion error, throw it
      if (error instanceof Error && error.message.includes("execution failed")) {
        throw error
      }
      // Otherwise, continue polling
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
    }
  }

  throw new Error(`Intent ${intentId} did not complete within ${timeoutMs}ms`)
}

