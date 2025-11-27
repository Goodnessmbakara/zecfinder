import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, StopCircle, Menu, Plus, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useWalletStore } from '@/lib/walletStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
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
  
  // Get username from shared wallet store
  const { username } = useWalletStore();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch history on mount and when username changes
  useEffect(() => {
    if (username) {
      fetchHistory();
    }
  }, [username]);

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
      let fullResponse = "";

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
    <div className="flex h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence mode='wait'>
        {isSidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-zinc-900 border-r border-zinc-800 flex flex-col"
          >
            <div className="p-4">
              <Button 
                onClick={startNewChat}
                className="w-full justify-start gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700"
                variant="outline"
              >
                <Plus size={16} />
                New Chat
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
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative">
        {/* Mobile Header / Toggle */}
        <div className="absolute top-4 left-4 z-10">
           <Button 
             variant="ghost" 
             size="icon" 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className="text-zinc-400 hover:text-white hover:bg-zinc-800"
           >
             <Menu size={20} />
           </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-6 pt-10">
            {!username ? (
              <div className="text-center text-zinc-500 mt-20">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full" />
                </div>
                <h2 className="text-2xl font-semibold text-zinc-200 mb-2">Please Connect Your Wallet</h2>
                <p>Log in with your username above to start chatting with the ZecFinder agent.</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-zinc-500 mt-20">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full animate-pulse" />
                </div>
                <h2 className="text-2xl font-semibold text-zinc-200 mb-2">How can I help you?</h2>
                <p>Ask about your Zcash balance, shield funds, or send transactions.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-4 p-4 rounded-xl",
                    msg.role === 'assistant' ? "bg-zinc-900/50" : "bg-transparent"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    msg.role === 'assistant' ? "bg-green-600" : "bg-zinc-700"
                  )}>
                    {msg.role === 'assistant' ? 'AI' : 'U'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-zinc-200 prose-strong:text-white prose-code:text-green-400 prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800">
                      <ReactMarkdown
                        components={{
                          // Code blocks with syntax highlighting
                          code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
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
                  </div>
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-900">
          <div className="max-w-3xl mx-auto relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message ZecFinder..."
              className="w-full bg-zinc-900 text-zinc-100 rounded-xl pl-4 pr-24 py-3 focus:outline-none focus:ring-1 focus:ring-green-500/50 resize-none min-h-[52px] max-h-[200px]"
              rows={1}
            />
            <div className="absolute right-2 bottom-2 flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleListening}
                className={cn(
                  "hover:bg-zinc-800 transition-colors",
                  isListening ? "text-red-500 animate-pulse" : "text-zinc-400"
                )}
              >
                {isListening ? <StopCircle size={20} /> : <Mic size={20} />}
              </Button>
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
          <div className="text-center text-xs text-zinc-600 mt-2">
            AI can make mistakes. Check important info.
          </div>
        </div>
      </div>
    </div>
  );
};
