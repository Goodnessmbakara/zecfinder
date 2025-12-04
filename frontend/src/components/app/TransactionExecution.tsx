import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, CheckCircle, XCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useWalletStore } from '@/lib/walletStore';
import { 
  detectWalletExtensions, 
  getAvailableWallet, 
  hasWalletExtension, 
  connectWallet, 
  signAndSendTransaction
} from '@/lib/walletExtensions';
import type { WalletExtension } from '@/lib/walletExtensions';
import { isDemoMode, mockExecuteTransaction } from '@/lib/demoMode';

interface TransactionEvaluation {
  success: boolean
  requiresExecution: boolean
  intent: any
  transactionData?: {
    fromAddress: string
    toAddress: string
    amount: number
    currency: string
    fee?: number
    privacyLevel: "transparent" | "shielded" | "zero-link"
    estimatedFee?: number
    network: "mainnet" | "testnet"
  }
  unsignedTransaction?: {
    method: string
    params: any[]
    rpcMethod: string
  }
  validation?: {
    hasSufficientBalance: boolean
    balance: number
    requiredAmount: number
    errors: string[]
    warnings: string[]
  }
  message: string
  error?: string
}

interface TransactionExecutionProps {
  evaluation: TransactionEvaluation
  onComplete?: (result: { success: boolean; txid?: string; message: string }) => void
  onCancel?: () => void
}

export function TransactionExecution({ evaluation, onComplete, onCancel }: TransactionExecutionProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{ success: boolean; txid?: string; message: string; error?: string } | null>(null);
  const [availableExtensions, setAvailableExtensions] = useState<WalletExtension[]>([]);
  const [selectedExtension, setSelectedExtension] = useState<string | null>(null);
  const [useBrowserWallet, setUseBrowserWallet] = useState(false);
  const { username } = useWalletStore();

  // Detect available wallet extensions on mount
  useEffect(() => {
    const extensions = detectWalletExtensions();
    setAvailableExtensions(extensions);
    if (extensions.length > 0) {
      // Auto-select first available extension
      setSelectedExtension(extensions[0].id);
    }
  }, []);

  const handleExecute = async () => {
    if (!evaluation.requiresExecution || !evaluation.success) {
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      // Use browser wallet if selected and available
      if (useBrowserWallet && selectedExtension) {
        await executeWithWalletExtension(evaluation, selectedExtension);
      } else {
        // Execute via backend
        await executeViaBackend(evaluation);
      }
    } catch (error) {
      console.error("Transaction execution error:", error);
      setExecutionResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to execute transaction",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const executeWithWalletExtension = async (evalData: TransactionEvaluation, extensionId: string) => {
    if (!evalData.transactionData) {
      throw new Error("Transaction data is missing");
    }

    try {
      // Step 1: Connect to wallet extension
      const connection = await connectWallet(extensionId);
      
      if (!connection.accounts || connection.accounts.length === 0) {
        throw new Error("No accounts found in wallet");
      }

      // Step 2: Prepare transaction
      const transaction = {
        from: evalData.transactionData.fromAddress,
        to: evalData.transactionData.toAddress,
        amount: evalData.transactionData.amount,
        fee: evalData.transactionData.estimatedFee || evalData.transactionData.fee || 0.0001
      };

      // Step 3: Sign and send transaction
      const txHash = await signAndSendTransaction(extensionId, transaction);

      setExecutionResult({
        success: true,
        txid: txHash,
        message: `Transaction sent successfully via ${availableExtensions.find(e => e.id === extensionId)?.name || 'wallet extension'}. TXID: ${txHash.substring(0, 20)}...`
      });

      if (onComplete) {
        onComplete({
          success: true,
          txid: txHash,
          message: `Transaction sent successfully`
        });
      }
    } catch (error) {
      console.error("Wallet extension execution error:", error);
      throw error;
    }
  };

  const executeViaBackend = async (evalData: TransactionEvaluation) => {
    if (!username) {
      throw new Error("Username is required");
    }

    // Demo mode - use mock execution
    if (isDemoMode()) {
      try {
        const result = await mockExecuteTransaction(evalData.intent);
        setExecutionResult({
          success: result.success,
          txid: result.txid,
          message: result.message
        });
        if (onComplete) {
          onComplete(result);
        }
        return;
      } catch (error) {
        throw error;
      }
    }

    // Execute via backend confirmation endpoint
    const result = await api.confirmTransaction(evalData.intent);
    
    setExecutionResult({
      success: result.success,
      txid: result.txid,
      message: result.message,
      error: result.error
    });

    if (onComplete) {
      onComplete({
        success: result.success,
        txid: result.txid,
        message: result.message
      });
    }
  };


  if (!evaluation.requiresExecution) {
    return null;
  }

  const hasErrors = evaluation.validation?.errors && evaluation.validation.errors.length > 0;
  const hasWarnings = evaluation.validation?.warnings && evaluation.validation.warnings.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl"
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          hasErrors ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
        )}>
          {hasErrors ? <XCircle size={20} /> : <Wallet size={20} />}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white mb-2">
            Transaction Ready for Execution
          </h3>

          {evaluation.transactionData && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">From:</span>
                <span className="text-zinc-200 font-mono text-xs">
                  {evaluation.transactionData.fromAddress.substring(0, 10)}...
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">To:</span>
                <span className="text-zinc-200 font-mono text-xs">
                  {evaluation.transactionData.toAddress.substring(0, 10)}...
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Amount:</span>
                <span className="text-zinc-200 font-semibold">
                  {evaluation.transactionData.amount} {evaluation.transactionData.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Fee:</span>
                <span className="text-zinc-200">
                  {evaluation.transactionData.estimatedFee || evaluation.transactionData.fee || 0.0001} {evaluation.transactionData.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Privacy Level:</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded",
                  evaluation.transactionData.privacyLevel === "shielded" 
                    ? "bg-green-500/20 text-green-400"
                    : "bg-zinc-700 text-zinc-300"
                )}>
                  {evaluation.transactionData.privacyLevel}
                </span>
              </div>
            </div>
          )}

          {evaluation.validation && (
            <div className="mt-3 space-y-2">
              {evaluation.validation.errors.length > 0 && (
                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <div>
                      {evaluation.validation.errors.map((error, i) => (
                        <div key={i}>{error}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {hasWarnings && !hasErrors && (
                <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <div>
                      {evaluation.validation.warnings.map((warning, i) => (
                        <div key={i}>{warning}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!hasErrors && (
                <div className="p-2 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-400">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="shrink-0 mt-0.5" />
                    <div>
                      Balance: {evaluation.validation.balance} {evaluation.transactionData?.currency || "ZEC"}
                      {evaluation.validation.hasSufficientBalance && " ✓ Sufficient balance"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {executionResult && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mt-3 p-3 rounded-lg",
                executionResult.success 
                  ? "bg-green-500/10 border border-green-500/20" 
                  : "bg-red-500/10 border border-red-500/20"
              )}
            >
              <div className="flex items-start gap-2">
                {executionResult.success ? (
                  <CheckCircle size={16} className="text-green-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 text-sm">
                  <div className={executionResult.success ? "text-green-400" : "text-red-400"}>
                    {executionResult.message}
                  </div>
                  {executionResult.txid && (
                    <div className="mt-1 text-xs text-zinc-400 font-mono">
                      TXID: {executionResult.txid.substring(0, 20)}...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {!executionResult && (
            <div className="mt-4 space-y-3">
              {/* Wallet Selection */}
              {availableExtensions.length > 0 && (
                <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-zinc-300 flex items-center gap-2">
                      <Wallet size={14} />
                      Execution Method
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={useBrowserWallet}
                        onChange={(e) => setUseBrowserWallet(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-green-500 focus:ring-green-500"
                      />
                      <span className="text-xs text-zinc-400">Use Browser Wallet</span>
                    </div>
                  </div>
                  {useBrowserWallet && (
                    <select
                      value={selectedExtension || ''}
                      onChange={(e) => setSelectedExtension(e.target.value)}
                      className="w-full mt-2 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    >
                      {availableExtensions.map((ext) => (
                        <option key={ext.id} value={ext.id}>
                          {ext.name} {ext.available ? '✓' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {!useBrowserWallet && (
                    <p className="text-xs text-zinc-500 mt-2">
                      Transaction will be executed via backend server
                    </p>
                  )}
                </div>
              )}

              {/* Execute Button */}
              <div className="flex gap-2">
                <Button
                  onClick={handleExecute}
                  disabled={isExecuting || hasErrors || !evaluation.success}
                  className={cn(
                    "flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700",
                    "text-white shadow-lg shadow-green-500/20"
                  )}
                >
                  {isExecuting ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      {useBrowserWallet ? 'Signing with Wallet...' : 'Executing...'}
                    </>
                  ) : (
                    <>
                      <Wallet size={16} className="mr-2" />
                      {useBrowserWallet ? 'Sign & Execute' : 'Execute Transaction'}
                    </>
                  )}
                </Button>
                {onCancel && (
                  <Button
                    onClick={onCancel}
                    variant="ghost"
                    disabled={isExecuting}
                    className="text-zinc-400 hover:text-zinc-200"
                  >
                    Cancel
                  </Button>
                )}
              </div>

              {/* Info about browser wallets */}
              {availableExtensions.length === 0 && (
                <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300">
                  <p className="font-semibold mb-1">💡 Browser Wallet Extensions</p>
                  <p>Install a Zcash wallet extension (Zync Wallet, Brave Wallet, or MetaMask with Zcash Snap) to sign transactions directly in your browser.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

