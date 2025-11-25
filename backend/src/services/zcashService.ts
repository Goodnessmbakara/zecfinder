import { Config } from "@mayaprotocol/zcash-js"

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

export function initializeZcash(config: ZcashConfig) {
  zcashConfig = config
}

export function getZcashConfig(): Config | null {
  if (!zcashConfig) return null

  // Return config with correct network setting (mainnet: false for testnet, true for mainnet)
  return {
    server: {
      host: zcashConfig.rpcUrl,
      user: zcashConfig.rpcUser || "",
      password: zcashConfig.rpcPassword || ""
    },
    mainnet: zcashConfig.network === "mainnet" // false for testnet, true for mainnet
  }
}

/**
 * Create a new wallet (addresses) on the Zcash node.
 * Returns the Transparent Address, Private Key (WIF), and Shielded Address.
 */
export async function createWallet(): Promise<{ address: string; privateKey: string; shieldedAddress: string }> {
  try {
    // 1. Generate Transparent Address
    // getnewaddress accepts 0 params or 1 param (empty string for deprecated usage)
    const address = await callZcashRPC("getnewaddress", [])
    
    // 2. Generate Shielded Address (Sapling)
    // Use z_getnewaddress for shielded addresses (sapling, orchard, unified)
    let shieldedAddress = ""
    try {
      shieldedAddress = await callZcashRPC("z_getnewaddress", ["sapling"])
    } catch (e) {
      console.warn("z_getnewaddress failed, will not create shielded address", e)
      // Note: If z_getnewaddress fails, we continue without shielded address
      // The wallet will still work for transparent addresses
      shieldedAddress = ""
    }

    // 3. Get Private Key (for backup/DB purposes, though Node manages it)
    const privateKey = await callZcashRPC("dumpprivkey", [address])

    return { address, privateKey, shieldedAddress }
  } catch (error) {
    console.error("Error creating wallet:", error)
    throw error
  }
}

/**
 * Get balance for specific addresses.
 */
export async function getBalance(address: string, shieldedAddress?: string): Promise<WalletInfo> {
  const config = getZcashConfig()
  if (!config) {
    throw new Error("Zcash not configured")
  }

  try {
    // 1. Get Transparent Balance using listunspent for specific address
    // listunspent minconf maxconf [addresses]
    const utxos = await callZcashRPC("listunspent", [0, 9999999, [address]])
    const balance = utxos.reduce((acc: number, utxo: any) => acc + utxo.amount, 0)

    // 2. Get Shielded Balance
    let shieldedBal = 0
    if (shieldedAddress) {
      try {
        const zBal = await callZcashRPC("z_getbalance", [shieldedAddress])
        shieldedBal = typeof zBal === 'string' ? parseFloat(zBal) : zBal
      } catch (e) {
        console.warn("Failed to get shielded balance", e)
      }
    }

    return {
      address,
      balance,
      shieldedBalance: shieldedBal,
      shieldedAddress
    }
  } catch (error) {
    console.error("Error getting balance:", error)
    // Return zero values if RPC fails, but log error
    return {
      address,
      balance: 0,
      shieldedBalance: 0,
      shieldedAddress
    }
  }
}

/**
 * Send Transaction (Transparent -> Transparent/Shielded)
 * Uses z_sendmany which handles both t and z inputs/outputs if keys are in wallet.
 */
export async function sendTransaction(
  fromAddress: string,
  toAddress: string,
  amount: number
): Promise<string> {
  try {
    const params = [
      fromAddress,
      [{ address: toAddress, amount: amount }],
      1, // minconf
      0.0001 // fee
    ]
    return await callZcashRPC("z_sendmany", params)
  } catch (error) {
    console.error("Error sending transaction:", error)
    throw new Error(`Failed to send transaction: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Shield Transaction: Transparent -> Shielded
 */
export async function shieldTransaction(fromAddress: string, toShieldedAddress: string, amount: number): Promise<string> {
  try {
    // z_sendmany from t-address to z-address
    const params = [
      fromAddress,
      [{ address: toShieldedAddress, amount: amount }],
      1, // minconf
      0.0001 // fee
    ]
    return await callZcashRPC("z_sendmany", params)
  } catch (error) {
    console.error("Error shielding transaction:", error)
    throw new Error(`Failed to shield transaction: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Unshield Transaction: Shielded -> Transparent
 */
export async function unshieldTransaction(fromShieldedAddress: string, toTransparentAddress: string, amount: number): Promise<string> {
  try {
    const params = [
      fromShieldedAddress,
      [{ address: toTransparentAddress, amount: amount }],
      1, // minconf
      0.0001 // fee
    ]
    return await callZcashRPC("z_sendmany", params)
  } catch (error) {
    console.error("Error unshielding transaction:", error)
    throw new Error(`Failed to unshield transaction: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Check operation status
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
    const errorMessage = data.error.message || `RPC error: ${data.error.code}`
    if (errorMessage.includes("reindexing")) {
      throw new Error("Node is reindexing. Please wait.")
    }
    throw new Error(errorMessage)
  }
  return data.result
}

/**
 * Check if wallet needs initialization (backup acknowledgment)
 * This tests the actual operation that requires acknowledgment (getnewaddress)
 * rather than getwalletinfo, which might succeed even when acknowledgment is needed
 */
export async function checkWalletInitialization(): Promise<{ initialized: boolean; error?: string }> {
  try {
    // Test the actual operation that requires backup acknowledgment
    // getwalletinfo might succeed even when acknowledgment is needed
    await callZcashRPC("getnewaddress", [])
    return { initialized: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // Check for specific backup/initialization errors
    if (
      errorMessage.includes("Please acknowledge") ||
      errorMessage.includes("backed up") ||
      errorMessage.includes("zcashd-wallet-tool")
    ) {
      return { 
        initialized: false, 
        error: "Wallet backup acknowledgment required. Run 'zcashd-wallet-tool' to acknowledge the backup before creating addresses."
      }
    }
    
    // Check for exportdir configuration errors
    if (errorMessage.includes("exportdir") || errorMessage.includes("export-dir")) {
      return {
        initialized: false,
        error: "Wallet backup directory not configured. The Zcash node requires -exportdir to be set."
      }
    }
    
    // For other errors (like reindexing), return the error but don't assume initialization is needed
    // Reindexing is a different issue
    if (errorMessage.includes("reindexing")) {
      return {
        initialized: false,
        error: "Zcash node is currently reindexing. Please wait for reindexing to complete."
      }
    }
    
    // For other errors, return them for debugging
    return { 
      initialized: false, 
      error: errorMessage 
    }
  }
}

/**
 * Backup the wallet to satisfy the acknowledgment requirement.
 * This creates a backup file in the exportdir directory.
 * NOTE: backupwallet RPC creates a backup but does NOT acknowledge the backup requirement.
 * The acknowledgment must be done via zcashd-wallet-tool (interactive tool).
 */
export async function backupWallet(): Promise<string> {
  try {
    // Use alphanumeric-only filename (no hyphens or special chars) - required by zcashd
    const filename = `walletbackup${Date.now()}`
    await callZcashRPC("backupwallet", [filename])
    console.log(`Wallet backup created: ${filename}`)
    console.warn("NOTE: backupwallet creates a backup file but does NOT acknowledge the backup requirement.")
    console.warn("To use getnewaddress, you must run: zcashd-wallet-tool (interactive)")
    return filename
  } catch (error) {
    console.error("Error backing up wallet:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // Provide more helpful error messages
    if (errorMessage.includes("exportdir") || errorMessage.includes("export-dir")) {
      throw new Error("Wallet backup directory not configured. Please ensure -exportdir is set in zcashd configuration.")
    }
    
    if (errorMessage.includes("invalid") && errorMessage.includes("alphanumeric")) {
      throw new Error("Backup filename must contain only alphanumeric characters (a-z, A-Z, 0-9)")
    }
    
    if (errorMessage.includes("Please acknowledge") || errorMessage.includes("zcashd-wallet-tool")) {
      throw new Error("Wallet backup acknowledgment required. The backupwallet RPC creates a backup but does not acknowledge. You must run 'zcashd-wallet-tool' to acknowledge the backup.")
    }
    
    throw new Error(`Failed to backup wallet: ${errorMessage}`)
  }
}

/**
 * Check if we can create wallets (wallet is initialized)
 * Uses checkWalletInitialization which tests getnewaddress directly
 */
export async function canCreateWallet(): Promise<boolean> {
  try {
    const status = await checkWalletInitialization()
    return status.initialized
  } catch (error) {
    console.error("Cannot create wallet - initialization check failed:", error)
    return false
  }
}

// Deprecated/Unused functions from previous implementation can be removed or kept as stubs if needed by other files
// For now, I've replaced the core logic.

