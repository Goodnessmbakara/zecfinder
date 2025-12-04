/**
 * Wallet Extension Detection and Integration
 * Supports: Zync Wallet, Brave Wallet, MetaMask (with Zcash Snap)
 */

export interface WalletExtension {
  name: string
  id: string
  available: boolean
  connected: boolean
  accounts?: string[]
  network?: 'mainnet' | 'testnet'
}

export interface ZcashWalletProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>
  isConnected: () => boolean
  getAccounts: () => Promise<string[]>
  sendTransaction: (transaction: any) => Promise<string>
}

/**
 * Detect available Zcash wallet extensions
 */
export function detectWalletExtensions(): WalletExtension[] {
  const extensions: WalletExtension[] = []

  if (typeof window === 'undefined') {
    return extensions
  }

  // Check for Zync Wallet
  if ((window as any).zync) {
    extensions.push({
      name: 'Zync Wallet',
      id: 'zync',
      available: true,
      connected: false
    })
  }

  // Check for Brave Wallet (has native Zcash support)
  if ((window as any).braveSolana || (window as any).brave) {
    // Brave Wallet may support Zcash through its native wallet
    extensions.push({
      name: 'Brave Wallet',
      id: 'brave',
      available: true,
      connected: false
    })
  }

  // Check for MetaMask
  if ((window as any).ethereum && (window as any).ethereum.isMetaMask) {
    extensions.push({
      name: 'MetaMask',
      id: 'metamask',
      available: true,
      connected: false,
      // Note: MetaMask requires Zcash Shielded Wallet Snap for Zcash support
    })
  }

  return extensions
}

/**
 * Get the first available wallet extension
 */
export function getAvailableWallet(): WalletExtension | null {
  const extensions = detectWalletExtensions()
  return extensions.find(ext => ext.available) || null
}

/**
 * Check if any wallet extension is available
 */
export function hasWalletExtension(): boolean {
  return detectWalletExtensions().length > 0
}

/**
 * Connect to Zync Wallet
 */
export async function connectZyncWallet(): Promise<{ accounts: string[]; network: 'mainnet' | 'testnet' }> {
  if (typeof window === 'undefined' || !(window as any).zync) {
    throw new Error('Zync Wallet is not installed')
  }

  try {
    const zync = (window as any).zync
    // Zync Wallet connection API (adjust based on actual API)
    const accounts = await zync.request({ method: 'zcash_requestAccounts' })
    
    return {
      accounts: Array.isArray(accounts) ? accounts : [accounts],
      network: 'mainnet' // Zync may support testnet, adjust as needed
    }
  } catch (error) {
    throw new Error(`Failed to connect to Zync Wallet: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Connect to Brave Wallet for Zcash
 */
export async function connectBraveWallet(): Promise<{ accounts: string[]; network: 'mainnet' | 'testnet' }> {
  if (typeof window === 'undefined' || !(window as any).brave) {
    throw new Error('Brave Wallet is not available')
  }

  try {
    const brave = (window as any).brave
    // Brave Wallet Zcash connection (adjust based on actual API)
    const accounts = await brave.request({ 
      method: 'zcash_requestAccounts',
      params: []
    })
    
    return {
      accounts: Array.isArray(accounts) ? accounts : [accounts],
      network: 'mainnet'
    }
  } catch (error) {
    throw new Error(`Failed to connect to Brave Wallet: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Connect to MetaMask (requires Zcash Snap)
 */
export async function connectMetaMaskZcash(): Promise<{ accounts: string[]; network: 'mainnet' | 'testnet' }> {
  if (typeof window === 'undefined' || !(window as any).ethereum || !(window as any).ethereum.isMetaMask) {
    throw new Error('MetaMask is not installed')
  }

  try {
    const ethereum = (window as any).ethereum
    
    // First, check if Zcash Snap is installed
    const snaps = await ethereum.request({
      method: 'wallet_getSnaps'
    })

    // Look for Zcash Shielded Wallet Snap
    const zcashSnapId = 'npm:@chainsafe/zcash-shielded-wallet-snap' // Update with actual snap ID
    const hasZcashSnap = snaps && snaps[zcashSnapId]

    if (!hasZcashSnap) {
      throw new Error('Zcash Shielded Wallet Snap is not installed. Please install it from MetaMask Snaps directory.')
    }

    // Request accounts from Zcash Snap
    const accounts = await ethereum.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: zcashSnapId,
        request: {
          method: 'zcash_requestAccounts'
        }
      }
    })

    return {
      accounts: Array.isArray(accounts) ? accounts : [accounts],
      network: 'mainnet'
    }
  } catch (error) {
    throw new Error(`Failed to connect to MetaMask Zcash: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generic wallet connection function
 */
export async function connectWallet(extensionId: string): Promise<{ accounts: string[]; network: 'mainnet' | 'testnet' }> {
  switch (extensionId) {
    case 'zync':
      return connectZyncWallet()
    case 'brave':
      return connectBraveWallet()
    case 'metamask':
      return connectMetaMaskZcash()
    default:
      throw new Error(`Unknown wallet extension: ${extensionId}`)
  }
}

/**
 * Sign and send transaction using wallet extension
 */
export async function signAndSendTransaction(
  extensionId: string,
  transaction: {
    from: string
    to: string
    amount: number
    fee?: number
  }
): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Wallet extensions are only available in browser')
  }

  switch (extensionId) {
    case 'zync': {
      const zync = (window as any).zync
      if (!zync) throw new Error('Zync Wallet not available')
      
      // Zync Wallet transaction API (adjust based on actual API)
      const txHash = await zync.request({
        method: 'zcash_sendTransaction',
        params: [transaction]
      })
      return txHash
    }

    case 'brave': {
      const brave = (window as any).brave
      if (!brave) throw new Error('Brave Wallet not available')
      
      const txHash = await brave.request({
        method: 'zcash_sendTransaction',
        params: [transaction]
      })
      return txHash
    }

    case 'metamask': {
      const ethereum = (window as any).ethereum
      if (!ethereum || !ethereum.isMetaMask) {
        throw new Error('MetaMask not available')
      }

      const zcashSnapId = 'npm:@chainsafe/zcash-shielded-wallet-snap'
      const txHash = await ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: zcashSnapId,
          request: {
            method: 'zcash_sendTransaction',
            params: [transaction]
          }
        }
      })
      return txHash
    }

    default:
      throw new Error(`Unsupported wallet extension: ${extensionId}`)
  }
}

/**
 * Get wallet provider for a specific extension
 */
export function getWalletProvider(extensionId: string): ZcashWalletProvider | null {
  if (typeof window === 'undefined') {
    return null
  }

  switch (extensionId) {
    case 'zync':
      return (window as any).zync || null
    case 'brave':
      return (window as any).brave || null
    case 'metamask':
      return (window as any).ethereum || null
    default:
      return null
  }
}

