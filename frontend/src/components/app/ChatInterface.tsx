import { useState, useRef, useEffect } from "react"
import { Shield, Loader2, Mic, Plus, Globe, Headphones } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GenieLogo } from "./GenieLogo"
import { SuggestedPrompts } from "./SuggestedPrompts"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isPrivate?: boolean
}

const initialMessages: Message[] = []

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("chat")
  const [showPrompts, setShowPrompts] = useState(true)
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
      // Call real API
      const response = await api.chat(textToSend)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
        isPrivate: response.intent.isPrivate || false,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to process your request"}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
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
                            : "bg-obsidian text-foreground border border-obsidian"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {message.isPrivate && message.role === "assistant" && (
                            <Shield className="w-4 h-4 text-electric-emerald flex-shrink-0 mt-0.5" />
                          )}
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </div>
                        <div className="text-xs mt-2 opacity-60">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
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
                      <div className="bg-obsidian rounded-2xl px-4 py-3 border border-obsidian">
                        <Loader2 className="w-5 h-5 text-zec-indigo animate-spin" />
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

      {activeTab === "history" && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-foreground/60">No conversation history yet</p>
            <p className="text-sm text-foreground/40 mt-2">
              Your past conversations will appear here
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

