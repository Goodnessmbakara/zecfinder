import { useState, useEffect, useRef } from "react"
import { ChevronDown, Wallet } from "lucide-react"
import { useWalletStore } from "@/lib/walletStore"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"

// Helper to get currency symbol based on network
const getCurrencySymbol = (network?: 'testnet' | 'mainnet') => {
  // Default to testnet if not specified (since we're using testnet)
  return network === 'mainnet' ? 'ZEC' : 'TAZ'
}

export function AppHeader() {
  const [showWalletDropdown, setShowWalletDropdown] = useState(false)
  const { address, balance, isConnected, setAddress, setBalance, setConnected } = useWalletStore()
  const walletRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (walletRef.current && !walletRef.current.contains(event.target as Node)) {
        setShowWalletDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [setShowWalletDropdown])

  // Restore wallet from localStorage on mount
  useEffect(() => {
    const restoreWallet = async () => {
      const storedMnemonic = localStorage.getItem("wallet_mnemonic")
      if (storedMnemonic && !isConnected) {
        try {
          const wallet = await api.importWallet(storedMnemonic)
          setAddress(wallet.address)
          setConnected(true)
        } catch (error) {
          console.error("Failed to restore wallet:", error)
          // Clear invalid mnemonic
          localStorage.removeItem("wallet_mnemonic")
        }
      }
    }
    restoreWallet()
  }, []) // Only run on mount

  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet')

  // Fetch wallet data if connected
  useEffect(() => {
    if (isConnected && address) {
      const fetchBalance = async () => {
        try {
          const walletInfo = await api.getBalance()
          setBalance(walletInfo.balance, walletInfo.shieldedBalance)
          // Update network if provided
          if ((walletInfo as any).network) {
            setNetwork((walletInfo as any).network)
          }
        } catch (error) {
          console.error("Failed to fetch balance:", error)
        }
      }
      fetchBalance()
      const interval = setInterval(fetchBalance, 30000) // Refresh every 30s
      return () => clearInterval(interval)
    }
  }, [isConnected, address, setBalance])

  const handleConnectWallet = async () => {
    try {
      const wallet = await api.createWallet()
      setAddress(wallet.address)
      setConnected(true)
      // Store mnemonic securely (in production, use encrypted storage)
      localStorage.setItem("wallet_mnemonic", wallet.mnemonic)
    } catch (error) {
      console.error("Failed to create wallet:", error)
    }
  }

  const handleDisconnect = () => {
    setAddress(null)
    setBalance(0, 0)
    setConnected(false)
    localStorage.removeItem("wallet_mnemonic")
    setShowWalletDropdown(false)
  }

  const displayAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null

  return (
    <header className="border-b border-obsidian/50 bg-obsidian/30 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 h-16">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-electric-emerald to-dark-emerald flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="text-lg font-semibold text-foreground">nearAI</span>
        </div>

        {/* Right: Wallet Connection */}
        <div className="flex items-center gap-3">
          {isConnected && displayAddress ? (
            <div className="relative" ref={walletRef}>
              <button
                onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-obsidian/50 border border-obsidian/50 hover:border-electric-emerald/30 transition-colors"
              >
                <Wallet className="w-4 h-4 text-electric-emerald" />
                <span className="text-sm text-foreground font-medium">
                  {displayAddress}
                </span>
                {balance > 0 && (
                  <span className="text-xs text-foreground/60">
                    {balance.toFixed(4)} {getCurrencySymbol(network)}
                  </span>
                )}
                <ChevronDown className="w-4 h-4 text-foreground/60" />
              </button>
              {showWalletDropdown && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-obsidian border border-obsidian/50 rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-obsidian/50">
                    <p className="text-xs text-foreground/60 mb-1">Wallet Address</p>
                    <p className="text-sm text-foreground font-mono break-all">{address}</p>
                    {balance > 0 && (
                      <p className="text-sm text-electric-emerald mt-2">
                        Balance: {balance.toFixed(4)} {getCurrencySymbol(network)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-obsidian/50 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              onClick={handleConnectWallet}
              className="bg-electric-emerald hover:bg-dark-emerald text-midnight-graphite font-medium"
            >
              Sign In & Sign Up
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

