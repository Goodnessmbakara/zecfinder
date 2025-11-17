import { Shield, Wallet, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AppHeader() {
  return (
    <header className="border-b border-obsidian bg-obsidian/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: Logo/Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zec-indigo rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">ZF</span>
          </div>
          <span className="text-lg font-semibold text-foreground">ZecFinder</span>
        </div>

        {/* Center: Wallet Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-midnight-graphite border border-obsidian">
            <Shield className="w-4 h-4 text-electric-emerald" />
            <span className="text-sm text-foreground/80">Shielded</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-midnight-graphite border border-obsidian">
            <Wallet className="w-4 h-4 text-zec-indigo" />
            <span className="text-sm font-medium text-foreground">2.5 ZEC</span>
          </div>
        </div>

        {/* Right: Settings */}
        <Button variant="ghost" size="icon">
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </header>
  )
}

