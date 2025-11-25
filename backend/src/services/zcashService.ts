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

  return {
    server: {
      host: zcashConfig.rpcUrl,
      user: zcashConfig.rpcUser || "",
      password: zcashConfig.rpcPassword || ""
    },
    mainnet: zcashConfig.network === "mainnet"
  }
}

/**
 * Create a new wallet (addresses) on the Zcash node.
 * Returns the Transparent Address, Private Key (WIF), and Shielded Address.
 */
export async function createWallet(): Promise<{ address: string; privateKey: string; shieldedAddress: string }> {
  try {
    // 1. Generate Transparent Address
    const address = await callZcashRPC("getnewaddress", [])
    
    // 2. Generate Shielded Address (Sapling)
    let shieldedAddress = ""
    try {
      shieldedAddress = await callZcashRPC("z_getnewaddress", ["sapling"])
    } catch (e) {
      console.warn("z_getnewaddress failed, trying getnewaddress for unified/sapling", e)
      // Fallback or handle error
      shieldedAddress = await callZcashRPC("getnewaddress", ["", "sapling"]) // Attempt unified if supported
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

// Deprecated/Unused functions from previous implementation can be removed or kept as stubs if needed by other files
// For now, I've replaced the core logic.

