import { useState, useRef, useEffect } from "react"
import { Shield, Loader2, Mic, Plus, Globe, Headphones } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GenieLogo } from "./GenieLogo"
import { SuggestedPrompts } from "./SuggestedPrompts"
import { TransactionStatus } from "./TransactionStatus"
import { TransactionConfirm } from "./TransactionConfirm"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isPrivate?: boolean
  execution?: {
    success: boolean
    status: "pending" | "success" | "failed"
    txid?: string
    operationId?: string
    privacyLevel: "transparent" | "shielded" | "zero-link"
    message: string
    error?: string
  }
}

const initialMessages: Message[] = []

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("chat")
  const [showPrompts, setShowPrompts] = useState(true)
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    intent: any
    privacyLevel: "transparent" | "shielded" | "zero-link"
  } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (promptText?: string) => {
    const textToSend = promptText || input.trim()
    if (!textToSend || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setShowPrompts(false)
    setIsLoading(true)

    try {
      // Prepare conversation history (last 10 messages to avoid token limits)
      const historyToSend = messages
        .slice(-10)
        .map((msg) => ({
          role: msg.role,
          content: msg.content
        }))
      
      // Call real API with conversation history
      const response = await api.chat(textToSend, historyToSend)
      
      // Get execution from response
      const execution = response.execution
      
      // Check if execution requires confirmation
      const requiresExecution = ["send", "shield", "unshield", "swap"].includes(response.intent.action)
      const hasExecution = execution && requiresExecution
      
      // If execution exists but is pending or we need confirmation, show confirmation dialog
      if (hasExecution && execution && execution.status === "pending" && !execution.txid) {
        // Determine privacy level
        const privacyLevel = execution.privacyLevel || 
          (response.intent.isPrivate ? "shielded" : "transparent")
        
        setPendingConfirmation({
          intent: response.intent,
          privacyLevel
        })
      }
      
      // Check if the response contains an error (even if status is 200)
      if (response.error && response.errorType) {
        // Backend returned an error in the response body
        const error = new Error(response.message || response.error) as Error & { errorType?: string }
        error.errorType = response.errorType
        throw error
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
        isPrivate: response.intent.isPrivate || false,
        execution: execution
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      // Enhanced error messages with specific handling based on error type
      let errorMessage = "Failed to process your request"
      let errorType = "unknown"
      
      if (error instanceof Error) {
        // Extract error type if available
        const typedError = error as Error & { errorType?: string; statusCode?: number }
        errorType = typedError.errorType || "unknown"
        
        // Handle specific error types
        if (errorType === "api_key") {
          errorMessage = "Gemini API key is missing or invalid. Please configure your GEMINI_API_KEY environment variable."
        } else if (errorType === "network") {
          errorMessage = "Network error connecting to the AI service. Please check your internet connection and try again."
        } else if (errorType === "rate_limit") {
          errorMessage = "Rate limit exceeded. Please wait a moment and try again."
        } else if (errorType === "parsing") {
          errorMessage = "Failed to parse the AI response. Please try rephrasing your request."
        } else if (errorType === "invalid_response") {
          errorMessage = "Received an invalid response from the AI service. Please try again."
        } else if (errorType === "validation") {
          errorMessage = error.message || "Invalid request. Please check your input and try again."
        } else if (error.message.includes("Network") || error.message.includes("fetch")) {
          errorMessage = "Unable to connect to the server. Please check your connection and try again."
          errorType = "network"
        } else if (error.message.includes("Wallet not initialized")) {
          errorMessage = "Please create or import a wallet first to use this feature."
        } else if (error.message.includes("Insufficient")) {
          errorMessage = "Insufficient funds. Please check your balance and try again."
        } else if (error.message.includes("transaction") || error.message.includes("Transaction")) {
          // Provide context-aware error messages for transaction-related errors
          const lastUserMessage = messages.filter(m => m.role === "user").slice(-1)[0]
          if (lastUserMessage) {
            errorMessage = `Failed to process your request: "${lastUserMessage.content}". ${error.message}`
          } else {
            errorMessage = error.message || "An unexpected error occurred. Please try again."
          }
        } else {
          // Use the actual error message if available
          errorMessage = error.message || "An unexpected error occurred. Please try again."
        }
      }
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorMessage,
        timestamp: new Date(),
        execution: {
          success: false,
          status: "failed",
          privacyLevel: "transparent",
          message: errorMessage,
          error: error instanceof Error ? error.message : "Unknown error"
        }
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmTransaction = async () => {
    if (!pendingConfirmation) return

    try {
      const result = await api.confirmTransaction(pendingConfirmation.intent)
      
      // Update the last message with execution result
      setMessages((prev) => {
        const updated = [...prev]
        const lastMessage = updated[updated.length - 1]
        if (lastMessage && lastMessage.role === "assistant") {
          lastMessage.execution = {
            success: result.success,
            status: result.status as "pending" | "success" | "failed",
            txid: result.txid,
            operationId: result.operationId,
            privacyLevel: result.privacyLevel as "transparent" | "shielded" | "zero-link",
            message: result.message,
            error: result.error
          }
        }
        return updated
      })
    } catch (error) {
      console.error("Failed to confirm transaction:", error)
    } finally {
      setPendingConfirmation(null)
    }
  }

  const handleCancelTransaction = () => {
    setPendingConfirmation(null)
  }

  const handlePromptClick = (prompt: string) => {
    handleSend(prompt)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const hasMessages = messages.length > 0

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-midnight-graphite via-midnight-graphite to-[#0a1a1f] relative overflow-hidden">
      {/* Gradient overlay for glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-zec-indigo/5 via-transparent to-electric-emerald/5 pointer-events-none" />
      
      {/* Tabs */}
      <div className="border-b border-obsidian/50 px-6 pt-4 relative z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === "chat" && (
        <>
          {/* Messages Area or Empty State */}
          <ScrollArea className="flex-1 relative z-10" ref={scrollRef}>
            {!hasMessages ? (
              <div className="flex flex-col items-center justify-center h-full px-6 py-12 min-h-[600px]">
                {/* Tagline */}
                <p className="text-foreground/80 text-sm mb-4">
                  Private. Intelligent. Yours.
                </p>

                {/* Genie Logo */}
                <GenieLogo className="mb-6" />

                {/* Main Title */}
                <h1 className="text-4xl md:text-5xl font-bold text-center mb-2">
                  <span className="text-foreground">Talk to AI like your </span>
                  <span className="text-electric-emerald glow-emerald-text">financial advisor</span>
                </h1>

                {/* Suggested Prompts */}
                {showPrompts && (
                  <div className="mt-12 w-full max-w-2xl">
                    <SuggestedPrompts onPromptClick={handlePromptClick} />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-4",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-zec-indigo flex items-center justify-center flex-shrink-0">
                          <Shield className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3 max-w-[80%]",
                          message.role === "user"
                            ? "bg-zec-indigo text-white"
                            : message.execution?.status === "failed"
                            ? "bg-red-500/10 text-red-400 border border-red-500/30"
                            : "bg-obsidian text-foreground border border-obsidian"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {message.isPrivate && message.role === "assistant" && (
                            <Shield className="w-4 h-4 text-electric-emerald flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {message.content}
                            </p>
                            {message.role === "assistant" && messages.length > 2 && (
                              <div className="mt-2 text-xs text-foreground/50 italic">
                                (Context from {messages.length} previous messages)
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs mt-2 opacity-60 flex items-center justify-between">
                          <span>
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {message.execution && message.execution.status === "failed" && (
                            <span className="text-red-400 text-xs ml-2">
                              Transaction failed
                            </span>
                          )}
                        </div>
                        
                        {/* Execution Status */}
                        {message.execution && (
                          <div className="mt-3">
                            <TransactionStatus
                              status={message.execution.status}
                              txid={message.execution.txid}
                              operationId={message.execution.operationId}
                              privacyLevel={message.execution.privacyLevel}
                              message={message.execution.message}
                              error={message.execution.error}
                            />
                          </div>
                        )}
                      </div>
                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium">U</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-4 justify-start">
                      <div className="w-8 h-8 rounded-full bg-zec-indigo flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-obsidian rounded-2xl px-4 py-3 border border-obsidian flex items-center gap-2">
                        <Loader2 className="w-5 h-5 text-zec-indigo animate-spin" />
                        <span className="text-sm text-foreground/60">Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-obsidian/50 bg-obsidian/30 backdrop-blur-sm p-6 relative z-10">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3">
                {/* Left Controls */}
                <button
                  className="w-10 h-10 rounded-full border border-electric-emerald/30 bg-electric-emerald/10 flex items-center justify-center text-electric-emerald hover:bg-electric-emerald/20 transition-colors"
                  title="Add attachment"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button
                  className="px-4 py-2 rounded-lg border border-obsidian bg-obsidian/50 text-foreground/70 hover:text-foreground hover:border-electric-emerald/30 transition-colors flex items-center gap-2 text-sm"
                  title="Web Search"
                >
                  <Globe className="w-4 h-4" />
                  <span>Web Search</span>
                </button>
                
                {/* Input Field */}
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything. Speak freely."
                  className="flex-1 bg-obsidian/50 border-electric-emerald/30 focus:border-electric-emerald focus:ring-2 focus:ring-electric-emerald/20 rounded-xl px-4 py-3 text-base"
                  disabled={isLoading}
                />
                
                {/* Right Controls */}
                <button
                  className="p-2 text-foreground/60 hover:text-foreground transition-colors"
                  title="Voice input"
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button
                  className="p-2 text-foreground/60 hover:text-foreground transition-colors"
                  title="Audio output"
                >
                  <Headphones className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Transaction Confirmation Dialog */}
      {pendingConfirmation && (
        <TransactionConfirm
          intent={pendingConfirmation.intent}
          privacyLevel={pendingConfirmation.privacyLevel}
          onConfirm={handleConfirmTransaction}
          onCancel={handleCancelTransaction}
        />
      )}

      {activeTab === "history" && (
        <div className="flex-1 flex flex-col p-6 relative z-10">
          <div className="max-w-3xl mx-auto w-full">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Conversation History
            </h2>
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-foreground/60">No conversation history yet</p>
                <p className="text-sm text-foreground/40 mt-2">
                  Your past conversations will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-foreground/60 mb-4">
                  {messages.length} message{messages.length !== 1 ? "s" : ""} in this conversation
                </div>
                <div className="space-y-3">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={cn(
                        "rounded-lg p-4 border",
                        message.role === "user"
                          ? "bg-zec-indigo/10 border-zec-indigo/30"
                          : "bg-obsidian/50 border-obsidian"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0",
                          message.role === "user"
                            ? "bg-zec-indigo text-white"
                            : "bg-zec-indigo/20 text-zec-indigo"
                        )}>
                          {message.role === "user" ? "U" : "AI"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-foreground/50">
                            <span>
                              {message.timestamp.toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {message.execution && (
                              <span className={cn(
                                "px-2 py-0.5 rounded",
                                message.execution.status === "success"
                                  ? "bg-green-500/20 text-green-400"
                                  : message.execution.status === "failed"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                              )}>
                                {message.execution.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

