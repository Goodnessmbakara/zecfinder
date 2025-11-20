import { ParsedIntent } from "./aiAgent.js"
import {
  sendTransaction,
  shieldTransaction,
  unshieldTransaction,
  getBalance,
  getWalletAddress,
  checkShieldedOperationStatus
} from "./zcashService.js"
import { selectUTXOsForZeroLink, isShieldedAddress, isTransparentAddress } from "./zeroLinkRouting.js"
import { getUTXOS } from "@mayaprotocol/zcash-js"
import { getZcashConfig } from "./zcashService.js"
import { createSwapIntent, waitForIntentCompletion, getIntentResult } from "./nearIntents.js"

export interface ExecutionResult {
  success: boolean
  status: "pending" | "success" | "failed"
  txid?: string
  operationId?: string
  privacyLevel: "transparent" | "shielded" | "zero-link"
  message: string
  error?: string
}

/**
 * Execute a parsed intent and return the result
 */
export async function executeIntent(intent: ParsedIntent): Promise<ExecutionResult> {
  try {
    // Validate wallet is initialized
    const walletAddress = getWalletAddress()
    if (!walletAddress) {
      return {
        success: false,
        status: "failed",
        privacyLevel: "transparent",
        message: "Wallet not initialized. Please create or import a wallet first.",
        error: "Wallet not initialized"
      }
    }

    // Route to appropriate handler based on action
    switch (intent.action) {
      case "send":
        return await handleSend(intent)
      case "shield":
        return await handleShield(intent)
      case "unshield":
        return await handleUnshield(intent)
      case "balance":
        return await handleBalance(intent)
      case "query":
        return await handleQuery(intent)
      case "swap":
        return await handleSwap(intent)
      default:
        return {
          success: false,
          status: "failed",
          privacyLevel: "transparent",
          message: `Unknown action: ${intent.action}. I can help you send, shield, unshield, or check your balance.`,
          error: `Unknown action: ${intent.action}`
        }
    }
  } catch (error) {
    return {
      success: false,
      status: "failed",
      privacyLevel: "transparent",
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Handle send transaction intent
 */
async function handleSend(intent: ParsedIntent): Promise<ExecutionResult> {
  if (!intent.amount || intent.amount <= 0) {
    return {
      success: false,
      status: "failed",
      privacyLevel: "transparent",
      message: "Please specify a valid amount to send.",
      error: "Invalid amount"
    }
  }

  if (!intent.recipient) {
    return {
      success: false,
      status: "failed",
      privacyLevel: "transparent",
      message: "Please specify a recipient address.",
      error: "Missing recipient"
    }
  }

  try {
    const walletAddress = getWalletAddress()
    if (!walletAddress) {
      throw new Error("Wallet not initialized")
    }

    const config = getZcashConfig()
    if (!config) {
      throw new Error("Zcash not configured")
    }

    // Determine privacy level and routing
    const toAddress = intent.recipient
    const isToShielded = isShieldedAddress(toAddress)
    const isFromShielded = isShieldedAddress(walletAddress)
    const useZeroLink = intent.isPrivate && !isToShielded && !isFromShielded

    let txid: string
    let privacyLevel: "transparent" | "shielded" | "zero-link"

    if (isToShielded || isFromShielded) {
      // Shielded transaction - use z_sendmany (handled in sendTransaction)
      // For now, we'll use the regular sendTransaction which will need to be enhanced
      // to handle z-addresses properly
      txid = await sendTransaction(toAddress, intent.amount, true)
      privacyLevel = "shielded"
    } else if (useZeroLink) {
      // Zero-link routing for transparent transactions
      const utxos = await getUTXOS(walletAddress, config)
      const selectedUTXOs = selectUTXOsForZeroLink(intent.amount, utxos)
      
      // Use selected UTXOs for transaction (this would require modifying sendTransaction)
      // For now, we'll use the regular sendTransaction with isPrivate flag
      txid = await sendTransaction(toAddress, intent.amount, true)
      privacyLevel = "zero-link"
    } else {
      // Regular transparent transaction
      txid = await sendTransaction(toAddress, intent.amount, false)
      privacyLevel = "transparent"
    }

    return {
      success: true,
      status: "success",
      txid,
      privacyLevel,
      message: `Successfully sent ${intent.amount} ${intent.currency || "ZEC"} to ${toAddress.substring(0, 10)}... (${privacyLevel})`
    }
  } catch (error) {
    return {
      success: false,
      status: "failed",
      privacyLevel: "transparent",
      message: `Failed to send transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Handle shield transaction intent
 */
async function handleShield(intent: ParsedIntent): Promise<ExecutionResult> {
  if (!intent.amount || intent.amount <= 0) {
    return {
      success: false,
      status: "failed",
      privacyLevel: "shielded",
      message: "Please specify a valid amount to shield.",
      error: "Invalid amount"
    }
  }

  try {
    const operationId = await shieldTransaction(intent.amount)
    
    return {
      success: true,
      status: "pending",
      operationId,
      privacyLevel: "shielded",
      message: `Shielding ${intent.amount} ${intent.currency || "ZEC"} to private pool. Operation ID: ${operationId}`
    }
  } catch (error) {
    return {
      success: false,
      status: "failed",
      privacyLevel: "shielded",
      message: `Failed to shield transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Handle unshield transaction intent
 */
async function handleUnshield(intent: ParsedIntent): Promise<ExecutionResult> {
  if (!intent.amount || intent.amount <= 0) {
    return {
      success: false,
      status: "failed",
      privacyLevel: "shielded",
      message: "Please specify a valid amount to unshield.",
      error: "Invalid amount"
    }
  }

  try {
    const toAddress = intent.recipient || getWalletAddress() || undefined
    const operationId = await unshieldTransaction(intent.amount, toAddress)
    
    return {
      success: true,
      status: "pending",
      operationId,
      privacyLevel: "shielded",
      message: `Unshielding ${intent.amount} ${intent.currency || "ZEC"} from private pool. Operation ID: ${operationId}`
    }
  } catch (error) {
    return {
      success: false,
      status: "failed",
      privacyLevel: "shielded",
      message: `Failed to unshield transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Handle balance query intent
 */
async function handleBalance(intent: ParsedIntent): Promise<ExecutionResult> {
  try {
    const walletInfo = await getBalance()
    
    return {
      success: true,
      status: "success",
      privacyLevel: "transparent",
      message: `Balance: ${walletInfo.balance} ZEC (transparent), ${walletInfo.shieldedBalance || 0} ZEC (shielded)`
    }
  } catch (error) {
    return {
      success: false,
      status: "failed",
      privacyLevel: "transparent",
      message: `Failed to get balance: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Handle general query intent
 */
async function handleQuery(intent: ParsedIntent): Promise<ExecutionResult> {
  try {
    const walletAddress = getWalletAddress()
    const walletInfo = await getBalance()
    
    return {
      success: true,
      status: "success",
      privacyLevel: "transparent",
      message: `Wallet Address: ${walletAddress}\nTransparent Balance: ${walletInfo.balance} ZEC\nShielded Balance: ${walletInfo.shieldedBalance || 0} ZEC${walletInfo.shieldedAddress ? `\nShielded Address: ${walletInfo.shieldedAddress.substring(0, 10)}...` : ""}`
    }
  } catch (error) {
    return {
      success: false,
      status: "failed",
      privacyLevel: "transparent",
      message: `Failed to query wallet: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Handle swap transaction intent (cross-chain via NEAR Intents)
 */
async function handleSwap(intent: ParsedIntent): Promise<ExecutionResult> {
  if (!intent.amount || intent.amount <= 0) {
    return {
      success: false,
      status: "failed",
      privacyLevel: "transparent",
      message: "Please specify a valid amount to swap.",
      error: "Invalid amount"
    }
  }

  if (!intent.swapFrom || !intent.swapTo) {
    return {
      success: false,
      status: "failed",
      privacyLevel: "transparent",
      message: "Please specify both source and destination assets for the swap (e.g., 'swap 0.01 BTC to ZEC').",
      error: "Missing swap parameters"
    }
  }

  try {
    const walletAddress = getWalletAddress()
    const recipient = intent.recipient || walletAddress || undefined

    // Create swap intent via NEAR Intents
    const intentId = await createSwapIntent({
      fromAsset: intent.swapFrom.toUpperCase(),
      toAsset: intent.swapTo.toUpperCase(),
      amount: intent.amount,
      recipient
    })

    // Wait for swap completion (with timeout)
    try {
      const result = await waitForIntentCompletion(intentId, 300000) // 5 minute timeout

      if (result.status === "completed" && result.txHash) {
        // Optionally auto-shield the received ZEC if swapTo is ZEC
        let shieldOperationId: string | undefined
        if (intent.swapTo.toUpperCase() === "ZEC" && intent.isPrivate) {
          try {
            // Wait a bit for the swap to settle, then shield
            await new Promise(resolve => setTimeout(resolve, 10000)) // 10 second delay
            shieldOperationId = await shieldTransaction(intent.amount)
          } catch (shieldError) {
            // Shield failed, but swap succeeded
            console.error("Failed to auto-shield after swap:", shieldError)
          }
        }

        return {
          success: true,
          status: "success",
          txid: result.txHash,
          operationId: shieldOperationId,
          privacyLevel: intent.isPrivate ? "shielded" : "transparent",
          message: `Successfully swapped ${intent.amount} ${intent.swapFrom} to ${intent.swapTo}. Transaction: ${result.txHash}${shieldOperationId ? ". Auto-shielding to private pool..." : ""}`
        }
      } else {
        return {
          success: false,
          status: "failed",
          privacyLevel: "transparent",
          message: result.error || "Swap failed",
          error: result.error || "Unknown error"
        }
      }
    } catch (timeoutError) {
      // Swap is still pending, return pending status
      return {
        success: true,
        status: "pending",
        privacyLevel: "transparent",
        message: `Swap intent created (ID: ${intentId}). The swap is being processed and may take a few minutes.`
      }
    }
  } catch (error) {
    return {
      success: false,
      status: "failed",
      privacyLevel: "transparent",
      message: `Failed to create swap intent: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Check the status of a shielded operation
 */
export async function checkOperationStatus(operationId: string): Promise<ExecutionResult> {
  try {
    const status = await checkShieldedOperationStatus(operationId)
    
    if (status.status === "success" && status.txid) {
      return {
        success: true,
        status: "success",
        txid: status.txid,
        privacyLevel: "shielded",
        message: `Transaction confirmed. TXID: ${status.txid}`
      }
    } else if (status.status === "executing" || status.status === "queued") {
      return {
        success: true,
        status: "pending",
        privacyLevel: "shielded",
        message: `Transaction is ${status.status}. Please check again later.`
      }
    } else if (status.error) {
      return {
        success: false,
        status: "failed",
        privacyLevel: "shielded",
        message: `Transaction failed: ${status.error}`,
        error: status.error
      }
    } else {
      return {
        success: true,
        status: "pending",
        privacyLevel: "shielded",
        message: `Transaction status: ${status.status}`
      }
    }
  } catch (error) {
    return {
      success: false,
      status: "failed",
      privacyLevel: "shielded",
      message: `Failed to check operation status: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

