import { useState } from "react"
import { Plus, MessageSquare, Trash2, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface Conversation {
  id: string
  title: string
  timestamp: string
}

const mockConversations: Conversation[] = [
  { id: "1", title: "Send 0.5 ZEC to shielded address", timestamp: "2 hours ago" },
  { id: "2", title: "Check wallet balance", timestamp: "Yesterday" },
  { id: "3", title: "Bridge ZEC to Solana", timestamp: "2 days ago" },
]

export function Sidebar() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [conversations] = useState<Conversation[]>(mockConversations)

  return (
    <div className="w-64 h-full bg-obsidian border-r border-obsidian flex flex-col">
      {/* New Chat Button */}
      <div className="p-3">
        <Button
          className="w-full justify-start gap-2 bg-zec-indigo hover:bg-deep-indigo"
          onClick={() => setSelectedId(null)}
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      <Separator className="bg-obsidian" />

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors group hover:bg-midnight-graphite",
                selectedId === conv.id && "bg-midnight-graphite border border-zec-indigo/30"
              )}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 mt-0.5 text-foreground/60 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-foreground truncate">{conv.title}</div>
                  <div className="text-xs text-foreground/50 mt-0.5">{conv.timestamp}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // Handle delete
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-obsidian rounded"
                >
                  <Trash2 className="w-3.5 h-3.5 text-foreground/50" />
                </button>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      <Separator className="bg-obsidian" />

      {/* Bottom Actions */}
      <div className="p-3">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>
    </div>
  )
}

