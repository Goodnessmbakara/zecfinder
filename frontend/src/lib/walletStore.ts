import { create } from "zustand"

export interface WalletState {
  address: string | null
  balance: number
  shieldedBalance: number
  isConnected: boolean
  isLoading: boolean
  error: string | null
  setAddress: (address: string | null) => void
  setBalance: (balance: number, shieldedBalance?: number) => void
  setConnected: (connected: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  balance: 0,
  shieldedBalance: 0,
  isConnected: false,
  isLoading: false,
  error: null,
  setAddress: (address) => set({ address }),
  setBalance: (balance, shieldedBalance = 0) =>
    set({ balance, shieldedBalance }),
  setConnected: (connected) => set({ isConnected: connected }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      address: null,
      balance: 0,
      shieldedBalance: 0,
      isConnected: false,
      isLoading: false,
      error: null
    })
}))

