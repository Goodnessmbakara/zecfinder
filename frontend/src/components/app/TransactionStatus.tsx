import { Shield, CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

interface TransactionStatusProps {
  status: "pending" | "success" | "failed"
  txid?: string
  operationId?: string
  privacyLevel: "transparent" | "shielded" | "zero-link"
  message: string
  error?: string
  onStatusUpdate?: (newStatus: { status: "pending" | "success" | "failed"; txid?: string; error?: string }) => void
}

export function TransactionStatus({
  status: initialStatus,
  txid: initialTxid,
  operationId,
  privacyLevel,
  message: initialMessage,
  error: initialError,
  onStatusUpdate
}: TransactionStatusProps) {
  const [status, setStatus] = useState<"pending" | "success" | "failed">(initialStatus)
  const [txid, setTxid] = useState<string | undefined>(initialTxid)
  const [error, setError] = useState<string | undefined>(initialError)
  const [message, setMessage] = useState(initialMessage)
  // Poll for status updates if we have an operationId and status is pending
  useEffect(() => {
    if (!operationId || status !== "pending") return

    const pollInterval = setInterval(async () => {
      try {
        const statusResult = await api.checkTransactionStatus(operationId)
        
        if (statusResult.completed && statusResult.txid) {
          setStatus("success")
          setTxid(statusResult.txid)
          setMessage(`Transaction confirmed! TXID: ${statusResult.txid}`)
          onStatusUpdate?.({ status: "success", txid: statusResult.txid })
          clearInterval(pollInterval)
        } else if (statusResult.failed || statusResult.error) {
          setStatus("failed")
          setError(statusResult.error || "Transaction failed")
          setMessage(`Transaction failed: ${statusResult.error || "Unknown error"}`)
          onStatusUpdate?.({ status: "failed", error: statusResult.error })
          clearInterval(pollInterval)
        }
      } catch (err) {
        console.error("Error polling transaction status:", err)
        // Continue polling on error
      }
    }, 5000) // Poll every 5 seconds

    // Cleanup after 5 minutes
    const timeout = setTimeout(() => {
      clearInterval(pollInterval)
    }, 300000)

    return () => {
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [operationId, status, onStatusUpdate])

  const isPrivate = privacyLevel === "shielded" || privacyLevel === "zero-link"
  const isPending = status === "pending"
  const isSuccess = status === "success"
  const isFailed = status === "failed"

  // Block explorer URL (adjust based on network)
  const getExplorerUrl = (txid: string) => {
    // For testnet: https://testnet.zcashblockexplorer.com/tx/{txid}
    // For mainnet: https://zcashblockexplorer.com/tx/{txid}
    const network = import.meta.env.VITE_ZCASH_NETWORK || "testnet"
    const baseUrl = network === "testnet"
      ? "https://testnet.zcashblockexplorer.com"
      : "https://zcashblockexplorer.com"
    return `${baseUrl}/tx/${txid}`
  }

  return (
    <div
      className={cn(
        "rounded-xl p-4 border-2",
        isSuccess
          ? "bg-electric-emerald/10 border-electric-emerald/50"
          : isFailed
          ? "bg-red-500/10 border-red-500/50"
          : "bg-zec-indigo/10 border-zec-indigo/50"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
            isSuccess
              ? "bg-electric-emerald/20 text-electric-emerald"
              : isFailed
              ? "bg-red-500/20 text-red-500"
              : "bg-zec-indigo/20 text-zec-indigo"
          )}
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSuccess && <CheckCircle2 className="w-4 h-4" />}
          {isFailed && <XCircle className="w-4 h-4" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Message */}
          <div
            className={cn(
              "text-sm font-medium mb-2",
              isSuccess ? "text-electric-emerald" : isFailed ? "text-red-500" : "text-foreground"
            )}
          >
            {message}
          </div>

          {/* Privacy Badge */}
          {isPrivate && (
            <div className="flex items-center gap-1 mb-2">
              <Shield className="w-3 h-3 text-electric-emerald" />
              <span className="text-xs text-electric-emerald font-medium">
                {privacyLevel === "zero-link" ? "Zero-Link" : "Shielded"}
              </span>
            </div>
          )}

          {/* Transaction ID */}
          {txid && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-foreground/60">TXID:</span>
              <a
                href={getExplorerUrl(txid)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zec-indigo hover:text-deep-indigo font-mono break-all flex items-center gap-1"
              >
                {txid.substring(0, 16)}...
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Operation ID (for shielded transactions) */}
          {operationId && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-foreground/60">Operation ID:</span>
              <span className="text-xs text-foreground/80 font-mono break-all">
                {operationId.substring(0, 16)}...
              </span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-xs text-red-500 mt-2 p-2 bg-red-500/10 rounded border border-red-500/20">
              {error}
            </div>
          )}

          {/* Status Timeline */}
          <div className="flex items-center gap-2 mt-3 text-xs text-foreground/60">
            <div className={cn("w-2 h-2 rounded-full", isSuccess && "bg-electric-emerald")} />
            <span>{isPending ? "Processing..." : isSuccess ? "Confirmed" : "Failed"}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

