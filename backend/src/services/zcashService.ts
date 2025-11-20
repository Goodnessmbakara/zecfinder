import { Config, getUTXOS, buildTx, signAndFinalize, sendRawTransaction } from "@mayaprotocol/zcash-js"
import crypto from "crypto"

export interface WalletInfo {
  address: string
  balance: number // Transparent balance
  shieldedBalance?: number // Shielded balance
  shieldedAddress?: string // z-address if available
}

export interface ZcashConfig {
  rpcUrl: string
  rpcUser?: string
  rpcPassword?: string
  network: "mainnet" | "testnet"
}

let zcashConfig: ZcashConfig | null = null
let walletAddress: string | null = null
let privateKey: string | null = null
let shieldedAddress: string | null = null

export function initializeZcash(config: ZcashConfig) {
  zcashConfig = config
}

export function getZcashConfig(): Config | null {
  if (!zcashConfig) return null

  return {
    server: {
      host: zcashConfig.rpcUrl,
      user: zcashConfig.rpcUser || "",
      password: zcashConfig.rpcPassword || ""
    },
    mainnet: zcashConfig.network === "mainnet"
  }
}

export async function createWallet(): Promise<{ address: string; mnemonic: string; privateKey: string }> {
  // For MVP, generate a simple wallet structure
  // In production, use proper Zcash wallet libraries
  const privateKeyBytes = crypto.randomBytes(32)
  const privateKeyHex = privateKeyBytes.toString("hex")
  
  // Generate a testnet address (simplified for MVP)
  // In production, use proper address generation from private key
  const address = `t1${crypto.randomBytes(20).toString("hex")}`
  
  // Generate mnemonic (simplified - use proper BIP39 library in production)
  const mnemonic = generateMnemonic()
  
  walletAddress = address
  privateKey = privateKeyHex
  
  return { address, mnemonic, privateKey: privateKeyHex }
}

export async function importWallet(mnemonic: string): Promise<{ address: string; privateKey: string }> {
  // For MVP, simplified import
  // In production, derive private key and address from mnemonic properly
  const privateKeyBytes = crypto.randomBytes(32)
  const privateKeyHex = privateKeyBytes.toString("hex")
  const address = `t1${crypto.randomBytes(20).toString("hex")}`
  
  walletAddress = address
  privateKey = privateKeyHex
  
  return { address, privateKey: privateKeyHex }
}

export async function getBalance(): Promise<WalletInfo> {
  if (!walletAddress) {
    throw new Error("Wallet not initialized")
  }

  const config = getZcashConfig()
  if (!config) {
    throw new Error("Zcash not configured")
  }

  try {
    // Get transparent balance
    const transparentBalance = await callZcashRPC("getreceivedbyaddress", [walletAddress, 0])
    const balance = transparentBalance ? parseFloat(transparentBalance) / 100000000 : 0

    // Get shielded balance
    let shieldedBal = 0
    let zAddress: string | undefined = undefined
    try {
      shieldedBal = await getShieldedBalance()
      zAddress = await getShieldedAddress()
    } catch (error) {
      // Shielded address may not be available, continue without it
      console.error("Could not get shielded address:", error)
    }

    return {
      address: walletAddress,
      balance,
      shieldedBalance: shieldedBal,
      shieldedAddress: zAddress
    }
  } catch (error) {
    console.error("Error getting balance:", error)
    // Return mock balance for MVP if RPC fails
    try {
      const zAddress = await getShieldedAddress()
      return {
        address: walletAddress,
        balance: 0,
        shieldedBalance: 0,
        shieldedAddress: zAddress
      }
    } catch {
      return {
        address: walletAddress,
        balance: 0,
        shieldedBalance: 0
      }
    }
  }
}

export async function sendTransaction(
  toAddress: string,
  amount: number,
  isPrivate: boolean = false
): Promise<string> {
  if (!walletAddress || !privateKey) {
    throw new Error("Wallet not initialized")
  }

  const config = getZcashConfig()
  if (!config) {
    throw new Error("Zcash not configured")
  }

  try {
    // Get UTXOs
    const utxos = await getUTXOS(walletAddress, config)

    // Convert amount to satoshis (zatoshi for Zcash)
    const amountZatoshi = Math.floor(amount * 100000000)

    // Build transaction
    const tx = await buildTx(
      0, // current block height (should fetch from RPC in production)
      walletAddress,
      toAddress,
      amountZatoshi,
      utxos,
      false // memo transaction
    )

    // Sign transaction
    const signedTx = await signAndFinalize(
      tx.height,
      privateKey,
      tx.inputs,
      tx.outputs
    )

    // Send transaction
    const txid = await sendRawTransaction(signedTx, config)
    return txid
  } catch (error) {
    console.error("Error sending transaction:", error)
    throw new Error(`Failed to send transaction: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export function getWalletAddress(): string | null {
  return walletAddress
}

function generateMnemonic(): string {
  // Simplified mnemonic generation for MVP
  // In production, use proper BIP39 library
  const words = [
    "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract",
    "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid"
  ]
  return Array.from({ length: 12 }, () => words[Math.floor(Math.random() * words.length)]).join(" ")
}

/**
 * Helper function to call Zcash RPC methods
 */
async function callZcashRPC(method: string, params: any[]): Promise<any> {
  const config = getZcashConfig()
  if (!config) {
    throw new Error("Zcash not configured")
  }

  const response = await fetch(config.server.host, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${Buffer.from(`${config.server.user}:${config.server.password}`).toString("base64")}`
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params
    })
  })

  const data = await response.json() as { error?: { message?: string; code?: number }; result?: any }
  if (data.error) {
    throw new Error(data.error.message || `RPC error: ${data.error.code}`)
  }
  return data.result
}

/**
 * Get or create a shielded address (z-address)
 */
export async function getShieldedAddress(): Promise<string> {
  if (shieldedAddress) {
    return shieldedAddress
  }

  try {
    // First, try to get existing shielded addresses
    const addresses = await callZcashRPC("z_listaddresses", [])
    
    if (addresses && Array.isArray(addresses) && addresses.length > 0) {
      // Use the first available shielded address
      const firstAddress = addresses[0]
      if (typeof firstAddress === "string") {
        shieldedAddress = firstAddress
        return shieldedAddress
      }
    }

    // If no shielded address exists, create a new one
    const newAddress = await callZcashRPC("z_getnewaddress", ["sapling"])
    shieldedAddress = newAddress
    return newAddress
  } catch (error) {
    console.error("Error getting shielded address:", error)
    throw new Error(`Failed to get shielded address: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Get shielded balance for the wallet
 */
export async function getShieldedBalance(): Promise<number> {
  try {
    const zAddress = await getShieldedAddress()
    const balance = await callZcashRPC("z_getbalance", [zAddress])
    return balance ? parseFloat(balance) / 100000000 : 0 // Convert from zatoshi to ZEC
  } catch (error) {
    console.error("Error getting shielded balance:", error)
    return 0
  }
}

/**
 * Shield transaction: Transfer from transparent (t-address) to shielded (z-address)
 */
export async function shieldTransaction(amount: number): Promise<string> {
  if (!walletAddress) {
    throw new Error("Wallet not initialized")
  }

  try {
    const zAddress = await getShieldedAddress()
    const amountZatoshi = Math.floor(amount * 100000000)

    // z_sendmany parameters:
    // fromaddress: transparent address
    // amounts: array of {address, amount} objects
    // minconf: minimum confirmations (default 1)
    // fee: transaction fee in zatoshis (optional)
    const params = [
      walletAddress, // fromaddress
      [
        {
          address: zAddress,
          amount: amountZatoshi
        }
      ],
      1, // minconf
      null // fee (let node calculate)
    ]

    const operationId = await callZcashRPC("z_sendmany", params)
    return operationId
  } catch (error) {
    console.error("Error shielding transaction:", error)
    throw new Error(`Failed to shield transaction: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Unshield transaction: Transfer from shielded (z-address) to transparent (t-address)
 */
export async function unshieldTransaction(amount: number, toAddress?: string): Promise<string> {
  if (!walletAddress) {
    throw new Error("Wallet not initialized")
  }

  try {
    const zAddress = await getShieldedAddress()
    const targetAddress = toAddress || walletAddress
    const amountZatoshi = Math.floor(amount * 100000000)

    // z_sendmany parameters for unshielding:
    // fromaddress: shielded address
    // amounts: array of {address, amount} objects (transparent address)
    const params = [
      zAddress, // fromaddress (shielded)
      [
        {
          address: targetAddress,
          amount: amountZatoshi
        }
      ],
      1, // minconf
      null // fee
    ]

    const operationId = await callZcashRPC("z_sendmany", params)
    return operationId
  } catch (error) {
    console.error("Error unshielding transaction:", error)
    throw new Error(`Failed to unshield transaction: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Check the status of a shielded transaction operation
 */
export async function checkShieldedOperationStatus(operationId: string): Promise<{
  status: string
  txid?: string
  error?: string
}> {
  try {
    const status = await callZcashRPC("z_getoperationstatus", [[operationId]])
    
    if (status && status.length > 0) {
      const operation = status[0]
      return {
        status: operation.status || "unknown",
        txid: operation.result?.txid,
        error: operation.error?.message
      }
    }
    
    return { status: "unknown" }
  } catch (error) {
    console.error("Error checking operation status:", error)
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

