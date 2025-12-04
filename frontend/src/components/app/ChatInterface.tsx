import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, StopCircle, Menu, Plus, MessageSquare, Sparkles, Zap, Wallet, ArrowRight, RefreshCw, Copy, Check, Shield, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWalletStore } from '@/lib/walletStore';
import { TransactionExecution } from './TransactionExecution';
import { isDemoMode, mockLogin, setDemoMode } from '@/lib/demoMode';

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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  transactionEvaluation?: TransactionEvaluation;
}

interface Conversation {
  id: number;
  title: string;
  created_at: string;
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isWalletPanelOpen, setIsWalletPanelOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletInfo, setWalletInfo] = useState<{ balance: number; shieldedBalance: number; address: string; shieldedAddress: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Get username from shared wallet store
  const { username, setUsername, setAddress, setShieldedAddress } = useWalletStore();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch history on mount and when username changes
  useEffect(() => {
    if (username) {
      fetchHistory();
      fetchWalletBalance();
    }
  }, [username]);

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    if (!username) return;
    try {
      if (isDemoMode()) {
        const demoUser = await mockLogin(username);
        setWalletInfo({
          balance: demoUser.balance,
          shieldedBalance: demoUser.shieldedBalance,
          address: demoUser.address,
          shieldedAddress: demoUser.shieldedAddress
        });
      } else {
        const res = await fetch(`${API_URL}/api/wallet/balance?username=${username}`);
        if (res.ok) {
          const data = await res.json();
          setWalletInfo({
            balance: data.balance || 0,
            shieldedBalance: data.shieldedBalance || 0,
            address: data.address || '',
            shieldedAddress: data.shieldedAddress || ''
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  // Handle wallet login
  const handleWalletLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    setWalletLoading(true);
    try {
      if (isDemoMode()) {
        const demoUser = await mockLogin(usernameInput.trim());
        setUsername(demoUser.username);
        setAddress(demoUser.address);
        setShieldedAddress(demoUser.shieldedAddress);
        setWalletInfo({
          balance: demoUser.balance,
          shieldedBalance: demoUser.shieldedBalance,
          address: demoUser.address,
          shieldedAddress: demoUser.shieldedAddress
        });
        setIsWalletPanelOpen(false);
      } else {
        const res = await fetch(`${API_URL}/api/wallet/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: usernameInput.trim() }),
        });
        const data = await res.json();
        if (res.ok) {
          setUsername(data.username);
          setAddress(data.address);
          setShieldedAddress(data.shieldedAddress || null);
          await fetchWalletBalance();
          setIsWalletPanelOpen(false);
        } else {
          alert('Login failed: ' + (data.error || data.details || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Connection error. Please check if the backend is running or enable Demo Mode.');
    } finally {
      setWalletLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const fetchHistory = async () => {
    if (!username) {
      console.warn("Cannot fetch history: no username");
      return;
    }
    try {
      const res = await fetch(`http://localhost:3001/api/chat/history?username=${username}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  const loadConversation = async (id: number) => {
    setCurrentConvId(id);
    try {
      const res = await fetch(`http://localhost:3001/api/chat/history/${id}`);
      if (res.ok) {
        const data = await res.json();
        // Map DB messages to UI messages
        const uiMessages: Message[] = data.map((m: any) => ({
          id: m.id.toString(),
          role: m.role,
          content: m.content,
          timestamp: new Date(m.created_at).getTime()
        }));
        setMessages(uiMessages);
      }
    } catch (e) {
      console.error("Failed to load conversation", e);
    }
  };

  const startNewChat = () => {
    setCurrentConvId(null);
    setMessages([]);
    setInput('');
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Create a placeholder for the AI response
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: Message = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, aiMsg]);

    if (!username) {
      setMessages((prev) =>
        prev.map(msg =>
          msg.id === aiMsgId
            ? { ...msg, content: "Please connect your wallet first by logging in above." }
            : msg
        )
      );
      setIsLoading(false);
      return;
    }

    try {
      // Check if demo mode is enabled
      const isDemo = localStorage.getItem('demo_mode') === 'true';

      let fullResponse = "";

      if (isDemo) {
        // Use mock chat response in demo mode
        const { mockChatResponse } = await import('@/lib/demoMode');
        const mockStream = mockChatResponse(username || 'demo', userMsg.content);

        for await (const chunk of mockStream) {
          fullResponse += chunk;
          setMessages((prev) =>
            prev.map(msg =>
              msg.id === aiMsgId
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        }
      } else {
        // Use real backend
        const response = await fetch('http://localhost:3001/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMsg.content,
            username,
            conversationId: currentConvId
          }),
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;

          setMessages((prev) =>
            prev.map(msg =>
              msg.id === aiMsgId
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        }
      }

      // Final parse of transaction evaluation after streaming completes (for both demo and real mode)
      let finalEvaluation: TransactionEvaluation | undefined;
      let cleanedContent = fullResponse;
      try {
        // Try multiple patterns for JSON code blocks
        const jsonMatch = fullResponse.match(/```json\n([\s\S]*?)\n```/) ||
          fullResponse.match(/```json([\s\S]*?)```/);
        if (jsonMatch) {
          const jsonContent = jsonMatch[1].trim();
          const jsonData = JSON.parse(jsonContent);
          if (jsonData.type === "transaction_evaluation" && jsonData.evaluation) {
            finalEvaluation = jsonData.evaluation;
            // Remove the JSON code block from the displayed content
            cleanedContent = fullResponse.replace(/```json\n?[\s\S]*?\n?```/, '').trim();
          }
        }
      } catch (e) {
        // Ignore parsing errors - JSON might be incomplete or malformed
        console.debug("Failed to parse transaction evaluation:", e);
      }

      // Update message with final evaluation and cleaned content
      setMessages((prev) =>
        prev.map(msg =>
          msg.id === aiMsgId
            ? {
              ...msg,
              content: cleanedContent,
              transactionEvaluation: finalEvaluation
            }
            : msg
        )
      );

      // Refresh history to get new title if it was a new chat
      if (!currentConvId) {
        fetchHistory();
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) =>
        prev.map(msg =>
          msg.id === aiMsgId
            ? { ...msg, content: msg.content + "\n\n*Error: Failed to get response.*" }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      startListening();
    }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert('Speech recognition not supported in this browser.');
      setIsListening(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-100 font-sans overflow-hidden">
      {/* Left Sidebar - Conversations */}
      <AnimatePresence mode='wait'>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-zinc-900/80 backdrop-blur-sm border-r border-zinc-800/50 flex flex-col shadow-xl"
          >
            <div className="border-b border-zinc-800">
              <Button
                onClick={startNewChat}
                className="w-full justify-center py-[1rem] gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/20 border-0"
              >
                <Plus size={18} />
                <span className="font-semibold">New Conversation</span>
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={cn(
                    "w-full text-left px-3 py-3 rounded-lg text-sm transition-colors flex items-center gap-2 truncate",
                    currentConvId === conv.id
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  )}
                >
                  <MessageSquare size={14} className="shrink-0" />
                  <span className="truncate">{conv.title || "New Conversation"}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Header Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          >
            <Menu size={20} />
          </Button>

          <div className="flex items-center gap-3">
            {username && walletInfo ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-white">{username}</div>
                  <div className="text-xs text-zinc-400">
                    {walletInfo.balance.toFixed(4)} ZEC • {walletInfo.shieldedBalance.toFixed(4)} ZEC (shielded)
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsWalletPanelOpen(!isWalletPanelOpen)}
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                >
                  <Wallet size={18} />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsWalletPanelOpen(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white gap-2"
                size="sm"
              >
                <Wallet size={16} />
                <span className="hidden sm:inline">Connect Wallet</span>
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth pt-16">
          <div className="max-w-4xl mx-auto space-y-6">
            {!username ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mt-12"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">Welcome to ZecFinder</h2>
                <p className="text-zinc-400 text-lg mb-8 max-w-md mx-auto">
                  Your AI-powered Zcash assistant. Connect your wallet to start managing your private transactions.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                  {[
                    { icon: Wallet, title: "Connect Wallet", desc: "Secure & private" },
                    { icon: Zap, title: "AI Assistant", desc: "Natural language" },
                    { icon: MessageSquare, title: "Start Chatting", desc: "Ask anything" }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-green-500/50 transition-colors"
                    >
                      <item.icon className="w-6 h-6 text-green-500 mb-2 mx-auto" />
                      <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                      <p className="text-xs text-zinc-500">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
                <p className="text-sm text-zinc-500">
                  Connect your wallet in the header to get started
                </p>
              </motion.div>
            ) : messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mt-8"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20 animate-pulse">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">How can I help you today?</h2>
                <p className="text-zinc-400 text-lg mb-8">Ask me anything about your Zcash wallet or start a conversation below.</p>

                {/* Suggested Prompts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto mb-8">
                  {[
                    { prompt: "What's my Zcash balance?", icon: "💰" },
                    { prompt: "Show me my transaction history", icon: "📜" },
                    { prompt: "Shield 0.5 ZEC", icon: "🔒" },
                    { prompt: "Send 0.1 ZEC to a friend", icon: "💸" }
                  ].map((suggestion, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      onClick={() => {
                        setInput(suggestion.prompt);
                        inputRef.current?.focus();
                      }}
                      className="text-left p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-green-500/50 hover:bg-zinc-900 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{suggestion.icon}</span>
                        <span className="text-zinc-300 group-hover:text-white transition-colors">
                          {suggestion.prompt}
                        </span>
                        <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-green-500 ml-auto transition-colors" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-4 p-5 rounded-2xl transition-all",
                    msg.role === 'assistant'
                      ? "bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border border-zinc-800/50"
                      : "bg-transparent"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm shadow-lg",
                    msg.role === 'assistant'
                      ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                      : "bg-zinc-800 text-zinc-300"
                  )}>
                    {msg.role === 'assistant' ? <Sparkles size={18} /> : 'U'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-zinc-200 prose-strong:text-white prose-code:text-green-400 prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800">
                      <ReactMarkdown
                        components={{
                          // Code blocks with syntax highlighting
                          code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            // Skip JSON code blocks that contain transaction evaluation data
                            if (!inline && match && match[1] === 'json') {
                              const content = String(children).replace(/\n$/, '');
                              try {
                                const jsonData = JSON.parse(content);
                                if (jsonData.type === "transaction_evaluation") {
                                  // Don't render this code block, it's handled separately
                                  return null;
                                }
                              } catch (e) {
                                // Not our transaction evaluation JSON, render normally
                              }
                            }
                            if (!inline && match) {
                              return (
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{
                                    margin: '0.5rem 0',
                                    borderRadius: '0.5rem',
                                    padding: '1rem'
                                  }}
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              );
                            }
                            // Inline code
                            return (
                              <code className={cn("bg-zinc-800 text-green-400 px-1.5 py-0.5 rounded text-sm font-mono", className)} {...props}>
                                {children}
                              </code>
                            );
                          },
                          // Paragraphs
                          p({ children }: any) {
                            return <p className="mb-2 text-zinc-200 leading-relaxed">{children}</p>;
                          },
                          // Headings
                          h1({ children }: any) {
                            return <h1 className="text-xl font-bold text-white mb-2 mt-4">{children}</h1>;
                          },
                          h2({ children }: any) {
                            return <h2 className="text-lg font-semibold text-white mb-2 mt-3">{children}</h2>;
                          },
                          h3({ children }: any) {
                            return <h3 className="text-base font-semibold text-white mb-1 mt-2">{children}</h3>;
                          },
                          // Lists
                          ul({ children }: any) {
                            return <ul className="list-disc list-inside mb-2 text-zinc-200 space-y-1">{children}</ul>;
                          },
                          ol({ children }: any) {
                            return <ol className="list-decimal list-inside mb-2 text-zinc-200 space-y-1">{children}</ol>;
                          },
                          li({ children }: any) {
                            return <li className="text-zinc-200">{children}</li>;
                          },
                          // Strong/Bold
                          strong({ children }: any) {
                            return <strong className="font-semibold text-white">{children}</strong>;
                          },
                          // Emphasis/Italic
                          em({ children }: any) {
                            return <em className="italic text-zinc-300">{children}</em>;
                          },
                          // Links
                          a({ href, children }: any) {
                            return (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-400 hover:text-green-300 underline"
                              >
                                {children}
                              </a>
                            );
                          },
                          // Blockquotes
                          blockquote({ children }: any) {
                            return (
                              <blockquote className="border-l-4 border-green-500 pl-4 my-2 italic text-zinc-300">
                                {children}
                              </blockquote>
                            );
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    {msg.transactionEvaluation && msg.transactionEvaluation.requiresExecution && (
                      <TransactionExecution
                        evaluation={msg.transactionEvaluation}
                        onComplete={(result) => {
                          console.log("Transaction completed:", result);
                          // Optionally update the message or show success
                        }}
                      />
                    )}
                  </div>
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - Always visible and prominent */}
        <div className="p-4 md:p-6 bg-gradient-to-t from-zinc-950 via-zinc-950 to-zinc-950/95 border-t border-zinc-800/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-zinc-900/80 border border-zinc-800 rounded-2xl p-2 shadow-xl">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={username ? "Ask me anything about your Zcash wallet..." : "Connect your wallet to start chatting..."}
                    disabled={!username}
                    className={cn(
                      "flex-1 bg-transparent text-zinc-100 rounded-xl pl-4 pr-20 py-4",
                      "focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none",
                      "min-h-[60px] max-h-[200px] text-base",
                      "placeholder:text-zinc-500",
                      !username && "opacity-50 cursor-not-allowed"
                    )}
                    rows={1}
                  />
                  <div className="flex gap-2 pb-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={toggleListening}
                      disabled={!username}
                      className={cn(
                        "hover:bg-zinc-800 transition-colors shrink-0",
                        isListening ? "text-red-500 animate-pulse" : "text-zinc-400",
                        !username && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isListening ? <StopCircle size={20} /> : <Mic size={20} />}
                    </Button>
                    <Button
                      size="icon"
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading || !username}
                      className={cn(
                        "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700",
                        "text-white shadow-lg shadow-green-500/20 shrink-0",
                        "disabled:opacity-50 disabled:cursor-not-allowed transition-all",
                        "h-10 w-10"
                      )}
                    >
                      <Send size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 px-2">
              <div className="text-xs text-zinc-500 flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                <span>AI can make mistakes. Check important info.</span>
              </div>
              {!username && (
                <Button
                  onClick={() => setIsWalletPanelOpen(true)}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-green-500 hover:text-green-400 hover:bg-green-500/10"
                >
                  Connect Wallet to Start
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Wallet Panel */}
      <AnimatePresence>
        {isWalletPanelOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="w-80 bg-zinc-900/95 backdrop-blur-sm border-l border-zinc-800/50 flex flex-col shadow-2xl"
          >
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Wallet size={20} />
                Wallet
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsWalletPanelOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {username && walletInfo ? (
                <>
                  <div className="space-y-3">
                    <div className="p-3 bg-zinc-800/50 rounded-lg">
                      <div className="text-xs text-zinc-400 mb-1">Transparent Balance</div>
                      <div className="text-2xl font-bold text-white">{walletInfo.balance.toFixed(4)} ZEC</div>
                    </div>
                    <div className="p-3 bg-zinc-800/50 rounded-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Shield className="h-12 w-12 text-green-500" />
                      </div>
                      <div className="text-xs text-green-400 mb-1">Shielded Balance</div>
                      <div className="text-2xl font-bold text-white">{walletInfo.shieldedBalance.toFixed(4)} ZEC</div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <div>
                      <Label className="text-xs text-zinc-400">Transparent Address</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 p-2 bg-zinc-800 rounded text-xs text-zinc-300 break-all">
                          {walletInfo.address.substring(0, 20)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8"
                          onClick={() => copyToClipboard(walletInfo.address, 't-addr')}
                        >
                          {copied === 't-addr' ? <Check size={14} /> : <Copy size={14} />}
                        </Button>
                      </div>
                    </div>
                    {walletInfo.shieldedAddress && (
                      <div>
                        <Label className="text-xs text-zinc-400">Shielded Address</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 p-2 bg-zinc-800 rounded text-xs text-zinc-300 break-all">
                            {walletInfo.shieldedAddress.substring(0, 20)}...
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-8 w-8"
                            onClick={() => copyToClipboard(walletInfo.shieldedAddress, 'z-addr')}
                          >
                            {copied === 'z-addr' ? <Check size={14} /> : <Copy size={14} />}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full border-zinc-700 text-zinc-300 hover:text-white"
                    onClick={() => {
                      setUsername(null);
                      setAddress(null);
                      setShieldedAddress(null);
                      setWalletInfo(null);
                      setIsWalletPanelOpen(false);
                    }}
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <form onSubmit={handleWalletLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="wallet-username" className="text-zinc-300 text-sm">Username</Label>
                    <Input
                      id="wallet-username"
                      placeholder="Enter username"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1"
                      disabled={walletLoading}
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={isDemoMode()}
                      onChange={(e) => setDemoMode(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-green-500"
                    />
                    <Label className="text-zinc-400 cursor-pointer">Enable Demo Mode</Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    disabled={walletLoading || !usernameInput.trim()}
                  >
                    {walletLoading ? (
                      <>
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet size={16} className="mr-2" />
                        Connect Wallet
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
