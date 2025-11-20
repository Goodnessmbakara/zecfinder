import { Shield, X, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TransactionConfirmProps {
  intent: {
    action: string
    amount?: number
    recipient?: string
    currency?: string
    isPrivate?: boolean
    swapFrom?: string
    swapTo?: string
  }
  privacyLevel: "transparent" | "shielded" | "zero-link"
  estimatedFee?: number
  onConfirm: () => void
  onCancel: () => void
}

export function TransactionConfirm({
  intent,
  privacyLevel,
  estimatedFee,
  onConfirm,
  onCancel
}: TransactionConfirmProps) {
  const isPrivate = privacyLevel === "shielded" || privacyLevel === "zero-link"
  const isSwap = intent.action === "swap"

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-obsidian border-2 border-zec-indigo/50 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-foreground">Confirm Transaction</h3>
          <button
            onClick={onCancel}
            className="text-foreground/60 hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Transaction Type */}
          <div className="flex items-center gap-2">
            <span className="text-foreground/60 text-sm">Type:</span>
            <span className="text-foreground font-medium capitalize">{intent.action}</span>
            {isPrivate && (
              <div className="flex items-center gap-1 text-electric-emerald">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-medium">Private</span>
              </div>
            )}
          </div>

          {/* Amount */}
          {intent.amount && (
            <div>
              <span className="text-foreground/60 text-sm">Amount:</span>
              <div className="text-foreground font-semibold text-lg">
                {intent.amount} {intent.currency || (isSwap ? `${intent.swapFrom} → ${intent.swapTo}` : "ZEC")}
              </div>
            </div>
          )}

          {/* Swap Details */}
          {isSwap && intent.swapFrom && intent.swapTo && (
            <div>
              <span className="text-foreground/60 text-sm">Swap:</span>
              <div className="text-foreground font-medium">
                {intent.swapFrom} → {intent.swapTo}
              </div>
            </div>
          )}

          {/* Recipient */}
          {intent.recipient && (
            <div>
              <span className="text-foreground/60 text-sm">Recipient:</span>
              <div className="text-foreground font-mono text-sm break-all">
                {intent.recipient}
              </div>
            </div>
          )}

          {/* Privacy Level Badge */}
          <div className="flex items-center gap-2 pt-2 border-t border-obsidian">
            <span className="text-foreground/60 text-sm">Privacy Level:</span>
            <div
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1",
                privacyLevel === "shielded" || privacyLevel === "zero-link"
                  ? "bg-electric-emerald/20 text-electric-emerald border border-electric-emerald/50"
                  : "bg-foreground/10 text-foreground/70 border border-foreground/20"
              )}
            >
              {privacyLevel === "shielded" && <Shield className="w-3 h-3" />}
              {privacyLevel === "zero-link" && <Shield className="w-3 h-3" />}
              {privacyLevel === "zero-link" ? "Zero-Link" : privacyLevel === "shielded" ? "Shielded" : "Transparent"}
            </div>
          </div>

          {/* Estimated Fee */}
          {estimatedFee !== undefined && (
            <div>
              <span className="text-foreground/60 text-sm">Estimated Fee:</span>
              <div className="text-foreground text-sm">~{estimatedFee} ZEC</div>
            </div>
          )}

          {/* Zero-Link Routing Status */}
          {privacyLevel === "zero-link" && (
            <div className="flex items-start gap-2 p-3 bg-electric-emerald/10 border border-electric-emerald/30 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-electric-emerald mt-0.5 flex-shrink-0" />
              <div className="text-xs text-electric-emerald">
                <div className="font-medium mb-1">Zero-Link Routing Active</div>
                <div className="text-electric-emerald/80">
                  UTXO selection optimized to minimize traceability
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 border-obsidian bg-obsidian/50 hover:bg-obsidian"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className={cn(
                "flex-1",
                isPrivate
                  ? "bg-electric-emerald hover:bg-electric-emerald/90 text-white"
                  : "bg-zec-indigo hover:bg-deep-indigo text-white"
              )}
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

