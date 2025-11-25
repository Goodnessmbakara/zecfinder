import { create } from "zustand"

export interface WalletState {
  address: string | null
  shieldedAddress: string | null
  balance: number
  shieldedBalance: number
  isConnected: boolean
  isLoading: boolean
  error: string | null
  username: string | null // Add username for authentication
  setAddress: (address: string | null) => void
  setShieldedAddress: (address: string | null) => void
  setBalance: (balance: number, shieldedBalance?: number) => void
  setConnected: (connected: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setUsername: (username: string | null) => void
  reset: () => void
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  shieldedAddress: null,
  balance: 0,
  shieldedBalance: 0,
  isConnected: false,
  isLoading: false,
  error: null,
  username: null,
  setAddress: (address) => set({ address }),
  setShieldedAddress: (shieldedAddress) => set({ shieldedAddress }),
  setBalance: (balance, shieldedBalance = 0) =>
    set({ balance, shieldedBalance }),
  setConnected: (connected) => set({ isConnected: connected }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setUsername: (username) => {
    set({ username })
    // Persist username to localStorage for persistence across page reloads
    if (username) {
      localStorage.setItem("wallet_username", username)
    } else {
      localStorage.removeItem("wallet_username")
    }
  },
  reset: () => {
    localStorage.removeItem("wallet_username")
    set({
      address: null,
      shieldedAddress: null,
      balance: 0,
      shieldedBalance: 0,
      isConnected: false,
      isLoading: false,
      error: null,
      username: null
    })
  }
}))

// Load username from localStorage on store initialization
if (typeof window !== "undefined") {
  const storedUsername = localStorage.getItem("wallet_username")
  if (storedUsername) {
    useWalletStore.getState().setUsername(storedUsername)
  }
}

