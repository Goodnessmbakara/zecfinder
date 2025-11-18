const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"

export interface ChatResponse {
  response: string
  intent: {
    action: string
    amount?: number
    recipient?: string
    currency?: string
    isPrivate?: boolean
    originalCommand: string
  }
  context?: {
    balance?: number
    address?: string
  }
}

export interface WalletInfo {
  address: string
  balance: number
  shieldedBalance?: number
}

export const api = {
  async chat(message: string): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    })

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.statusText}`)
    }

    return response.json()
  },

  async createWallet(): Promise<{ address: string; mnemonic: string; privateKey: string }> {
    const response = await fetch(`${API_BASE_URL}/api/wallet/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (!response.ok) {
      throw new Error(`Create wallet error: ${response.statusText}`)
    }

    return response.json()
  },

  async importWallet(mnemonic: string): Promise<{ address: string; privateKey: string }> {
    const response = await fetch(`${API_BASE_URL}/api/wallet/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ mnemonic })
    })

    if (!response.ok) {
      throw new Error(`Import wallet error: ${response.statusText}`)
    }

    return response.json()
  },

  async getBalance(): Promise<WalletInfo> {
    const response = await fetch(`${API_BASE_URL}/api/wallet/balance`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (!response.ok) {
      throw new Error(`Get balance error: ${response.statusText}`)
    }

    return response.json()
  },

  async getAddress(): Promise<{ address: string }> {
    const response = await fetch(`${API_BASE_URL}/api/wallet/address`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (!response.ok) {
      throw new Error(`Get address error: ${response.statusText}`)
    }

    return response.json()
  },

  async sendTransaction(
    toAddress: string,
    amount: number,
    isPrivate: boolean = false
  ): Promise<{ success: boolean; txid: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/transaction/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ toAddress, amount, isPrivate })
    })

    if (!response.ok) {
      throw new Error(`Send transaction error: ${response.statusText}`)
    }

    return response.json()
  }
}

