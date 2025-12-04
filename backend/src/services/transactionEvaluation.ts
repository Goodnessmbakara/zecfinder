import { ParsedIntent } from "./aiAgent.js"
import { getUser } from "../db/database.js"
import { getBalance, getZcashConfig } from "./zcashService.js"
import { isShieldedAddress, isTransparentAddress } from "./zeroLinkRouting.js"

export interface TransactionEvaluation {
  success: boolean
  requiresExecution: boolean
  intent: ParsedIntent
  transactionData?: {
    fromAddress: string
    toAddress: string
    amount: number
    currency: string
    fee?: number
    privacyLevel: "transparent" | "shielded" | "zero-link"
    estimatedFee?: number
    network: "mainnet" | "testnet"
  }
  unsignedTransaction?: {
    method: string
    params: any[]
    rpcMethod: string
  }
  validation?: {
    hasSufficientBalance: boolean
    balance: number
    requiredAmount: number
    errors: string[]
    warnings: string[]
  }
  message: string
  error?: string
}

/**
 * Evaluate a transaction intent and prepare transaction data for browser execution
 * This does NOT execute the transaction, only prepares and validates it
 */
export async function evaluateTransaction(intent: ParsedIntent, userId: string): Promise<TransactionEvaluation> {
  try {
    // Validate wallet is initialized
    const user = await getUser(userId);
    if (!user) {
      return {
        success: false,
        requiresExecution: false,
        intent,
        message: "Wallet not initialized. Please create or import a wallet first.",
        error: "Wallet not initialized"
      }
    }

    const config = getZcashConfig()
    if (!config) {
      return {
        success: false,
        requiresExecution: false,
        intent,
        message: "Zcash not configured",
        error: "Zcash not configured"
      }
    }

    const network = process.env.ZCASH_NETWORK === "mainnet" ? "mainnet" : "testnet"

    // Route to appropriate handler based on action
    switch (intent.action) {
      case "send":
        return await evaluateSend(intent, user, network)
      case "shield":
        return await evaluateShield(intent, user, network)
      case "unshield":
        return await evaluateUnshield(intent, user, network)
      case "balance":
      case "query":
        // These don't require execution, return success
        return {
          success: true,
          requiresExecution: false,
          intent,
          message: "Query action - no transaction execution needed"
        }
      case "swap":
        // Swap uses NEAR Intents, handled differently
        return {
          success: true,
          requiresExecution: true,
          intent,
          message: "Swap transaction - requires NEAR Intents execution"
        }
      default:
        return {
          success: false,
          requiresExecution: false,
          intent,
          message: `Unknown action: ${intent.action}`,
          error: `Unknown action: ${intent.action}`
        }
    }
  } catch (error) {
    return {
      success: false,
      requiresExecution: false,
      intent,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Evaluate send transaction intent
 */
async function evaluateSend(intent: ParsedIntent, user: any, network: "mainnet" | "testnet"): Promise<TransactionEvaluation> {
  if (!intent.amount || intent.amount <= 0) {
    return {
      success: false,
      requiresExecution: false,
      intent,
      message: "Please specify a valid amount to send.",
      error: "Invalid amount"
    }
  }

  if (!intent.recipient) {
    return {
      success: false,
      requiresExecution: false,
      intent,
      message: "Please specify a recipient address.",
      error: "Missing recipient"
    }
  }

  try {
    const walletAddress = user.wallet_address
    const toAddress = intent.recipient
    const amount = intent.amount
    const currency = intent.currency || "ZEC"

    // Determine privacy level
    const isToShielded = isShieldedAddress(toAddress)
    const isFromShielded = isShieldedAddress(walletAddress)
    const privacyLevel: "transparent" | "shielded" | "zero-link" = isToShielded ? "shielded" : "transparent"

    // Get balance for validation
    const walletInfo = await getBalance(walletAddress, user.shielded_address)
    const availableBalance = isFromShielded ? (walletInfo.shieldedBalance || 0) : walletInfo.balance
    
    // Estimate fee (0.0001 ZEC = 10000 zatoshi)
    const estimatedFee = 0.0001
    const requiredAmount = amount + estimatedFee
    const hasSufficientBalance = availableBalance >= requiredAmount

    const errors: string[] = []
    const warnings: string[] = []

    if (!hasSufficientBalance) {
      errors.push(`Insufficient balance. Available: ${availableBalance} ${currency}, Required: ${requiredAmount} ${currency}`)
    }

    if (!isToShielded && !isTransparentAddress(toAddress)) {
      errors.push("Invalid recipient address format")
    }

    if (errors.length > 0) {
      return {
        success: false,
        requiresExecution: false,
        intent,
        validation: {
          hasSufficientBalance,
          balance: availableBalance,
          requiredAmount,
          errors,
          warnings
        },
        message: errors.join("; "),
        error: errors.join("; ")
      }
    }

    // Prepare transaction data
    const transactionData = {
      fromAddress: walletAddress,
      toAddress,
      amount,
      currency,
      fee: estimatedFee,
      privacyLevel,
      estimatedFee,
      network
    }

    // Prepare unsigned transaction for RPC
    const unsignedTransaction = {
      method: "z_sendmany",
      params: [
        walletAddress,
        [{ address: toAddress, amount: amount }],
        1, // minconf
        estimatedFee // fee
      ],
      rpcMethod: "z_sendmany"
    }

    return {
      success: true,
      requiresExecution: true,
      intent,
      transactionData,
      unsignedTransaction,
      validation: {
        hasSufficientBalance,
        balance: availableBalance,
        requiredAmount,
        errors: [],
        warnings
      },
      message: `Ready to send ${amount} ${currency} to ${toAddress.substring(0, 10)}... (${privacyLevel})`
    }
  } catch (error) {
    return {
      success: false,
      requiresExecution: false,
      intent,
      message: `Failed to evaluate transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Evaluate shield transaction intent
 */
async function evaluateShield(intent: ParsedIntent, user: any, network: "mainnet" | "testnet"): Promise<TransactionEvaluation> {
  if (!intent.amount || intent.amount <= 0) {
    return {
      success: false,
      requiresExecution: false,
      intent,
      message: "Please specify a valid amount to shield.",
      error: "Invalid amount"
    }
  }

  try {
    const walletAddress = user.wallet_address
    const shieldedAddress = user.shielded_address
    const amount = intent.amount
    const currency = intent.currency || "ZEC"

    if (!shieldedAddress) {
      return {
        success: false,
        requiresExecution: false,
        intent,
        message: "Shielded address not available. Please create a shielded address first.",
        error: "Shielded address not available"
      }
    }

    // Get balance for validation
    const walletInfo = await getBalance(walletAddress, shieldedAddress)
    const availableBalance = walletInfo.balance
    const estimatedFee = 0.0001
    const requiredAmount = amount + estimatedFee
    const hasSufficientBalance = availableBalance >= requiredAmount

    const errors: string[] = []
    const warnings: string[] = []

    if (!hasSufficientBalance) {
      errors.push(`Insufficient balance. Available: ${availableBalance} ${currency}, Required: ${requiredAmount} ${currency}`)
    }

    if (errors.length > 0) {
      return {
        success: false,
        requiresExecution: false,
        intent,
        validation: {
          hasSufficientBalance,
          balance: availableBalance,
          requiredAmount,
          errors,
          warnings
        },
        message: errors.join("; "),
        error: errors.join("; ")
      }
    }

    // Prepare transaction data
    const transactionData = {
      fromAddress: walletAddress,
      toAddress: shieldedAddress,
      amount,
      currency,
      fee: estimatedFee,
      privacyLevel: "shielded" as const,
      estimatedFee,
      network
    }

    // Prepare unsigned transaction for RPC
    const unsignedTransaction = {
      method: "z_sendmany",
      params: [
        walletAddress,
        [{ address: shieldedAddress, amount: amount }],
        1, // minconf
        estimatedFee // fee
      ],
      rpcMethod: "z_sendmany"
    }

    return {
      success: true,
      requiresExecution: true,
      intent,
      transactionData,
      unsignedTransaction,
      validation: {
        hasSufficientBalance,
        balance: availableBalance,
        requiredAmount,
        errors: [],
        warnings
      },
      message: `Ready to shield ${amount} ${currency} to private pool`
    }
  } catch (error) {
    return {
      success: false,
      requiresExecution: false,
      intent,
      message: `Failed to evaluate shield transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Evaluate unshield transaction intent
 */
async function evaluateUnshield(intent: ParsedIntent, user: any, network: "mainnet" | "testnet"): Promise<TransactionEvaluation> {
  if (!intent.amount || intent.amount <= 0) {
    return {
      success: false,
      requiresExecution: false,
      intent,
      message: "Please specify a valid amount to unshield.",
      error: "Invalid amount"
    }
  }

  try {
    const shieldedAddress = user.shielded_address
    const toAddress = intent.recipient || user.wallet_address
    const amount = intent.amount
    const currency = intent.currency || "ZEC"

    if (!shieldedAddress) {
      return {
        success: false,
        requiresExecution: false,
        intent,
        message: "Shielded address not available.",
        error: "Shielded address not available"
      }
    }

    // Get balance for validation
    const walletInfo = await getBalance(user.wallet_address, shieldedAddress)
    const availableBalance = walletInfo.shieldedBalance || 0
    const estimatedFee = 0.0001
    const requiredAmount = amount + estimatedFee
    const hasSufficientBalance = availableBalance >= requiredAmount

    const errors: string[] = []
    const warnings: string[] = []

    if (!hasSufficientBalance) {
      errors.push(`Insufficient shielded balance. Available: ${availableBalance} ${currency}, Required: ${requiredAmount} ${currency}`)
    }

    if (errors.length > 0) {
      return {
        success: false,
        requiresExecution: false,
        intent,
        validation: {
          hasSufficientBalance,
          balance: availableBalance,
          requiredAmount,
          errors,
          warnings
        },
        message: errors.join("; "),
        error: errors.join("; ")
      }
    }

    // Prepare transaction data
    const transactionData = {
      fromAddress: shieldedAddress,
      toAddress,
      amount,
      currency,
      fee: estimatedFee,
      privacyLevel: "shielded" as const,
      estimatedFee,
      network
    }

    // Prepare unsigned transaction for RPC
    const unsignedTransaction = {
      method: "z_sendmany",
      params: [
        shieldedAddress,
        [{ address: toAddress, amount: amount }],
        1, // minconf
        estimatedFee // fee
      ],
      rpcMethod: "z_sendmany"
    }

    return {
      success: true,
      requiresExecution: true,
      intent,
      transactionData,
      unsignedTransaction,
      validation: {
        hasSufficientBalance,
        balance: availableBalance,
        requiredAmount,
        errors: [],
        warnings
      },
      message: `Ready to unshield ${amount} ${currency} from private pool`
    }
  } catch (error) {
    return {
      success: false,
      requiresExecution: false,
      intent,
      message: `Failed to evaluate unshield transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

