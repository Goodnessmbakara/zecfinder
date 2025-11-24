// Use environment variable if set, otherwise default to localhost for browser
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"

export interface ChatResponse {
  response: string
  intent: {
    action: string
    amount?: number
    recipient?: string
    currency?: string
    isPrivate?: boolean
    swapFrom?: string
    swapTo?: string
    originalCommand: string
  }
  context?: {
    balance?: number
    address?: string
    error?: string
  }
  execution?: {
    success: boolean
    status: "pending" | "success" | "failed"
    txid?: string
    operationId?: string
    privacyLevel: "transparent" | "shielded" | "zero-link"
    message: string
    error?: string
  }
  error?: string
  errorType?: "api_key" | "network" | "rate_limit" | "parsing" | "invalid_response" | "validation" | "unknown"
  message?: string
}

export interface WalletInfo {
  address: string
  balance: number
  shieldedBalance?: number
}

export const api = {
  async chat(
    message: string, 
    history?: Array<{ role: "user" | "assistant"; content: string }>
  ): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message, history: history || [] })
    })

    const data = await response.json().catch(() => ({}))
    
    if (!response.ok) {
      // Extract error message from response body if available
      const errorMessage = data.message || data.error || `Chat API error: ${response.statusText}`
      const error = new Error(errorMessage) as Error & { 
        errorType?: string
        statusCode?: number
      }
      error.errorType = data.errorType || "unknown"
      error.statusCode = response.status
      throw error
    }

    return data
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
  },

  async confirmTransaction(intent: any): Promise<{
    success: boolean
    status: string
    txid?: string
    operationId?: string
    privacyLevel: string
    message: string
    error?: string
  }> {
    const response = await fetch(`${API_BASE_URL}/api/transaction/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ intent, confirmed: true })
    })

    if (!response.ok) {
      throw new Error(`Confirm transaction error: ${response.statusText}`)
    }

    return response.json()
  },

  async checkTransactionStatus(operationId: string): Promise<{
    success: boolean
    operationId: string
    status: string
    txid?: string
    error?: string
    completed: boolean
    failed: boolean
  }> {
    const response = await fetch(`${API_BASE_URL}/api/transaction/status/${operationId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (!response.ok) {
      throw new Error(`Check transaction status error: ${response.statusText}`)
    }

    return response.json()
  },

  async checkSwapStatus(intentId: string): Promise<{
    id: string
    status: "pending" | "executing" | "completed" | "failed"
    createdAt: string
    updatedAt: string
  }> {
    const response = await fetch(`${API_BASE_URL}/api/transaction/swap/${intentId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (!response.ok) {
      throw new Error(`Check swap status error: ${response.statusText}`)
    }

    return response.json()
  }
}

