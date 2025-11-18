import { useState, useEffect } from "react"
import { MessageSquare, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const [activeNav, setActiveNav] = useState("chat")
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="w-16 h-full bg-obsidian border-r border-obsidian flex flex-col items-center py-4 gap-4">
      {/* Chat Icon - Main Navigation */}
      <button
        onClick={() => setActiveNav("chat")}
        className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
          activeNav === "chat"
            ? "bg-zec-indigo text-white"
            : "text-foreground/60 hover:bg-midnight-graphite hover:text-foreground"
        )}
        title="Chat"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Dark/Light Mode Toggle */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-foreground/60 hover:bg-midnight-graphite hover:text-foreground transition-colors"
        title="Toggle theme"
      >
        {mounted && theme === "dark" ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </button>
    </div>
  )
}

