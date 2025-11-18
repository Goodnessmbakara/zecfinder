import { cn } from "@/lib/utils"

interface GenieLogoProps {
  className?: string
  showSubtitle?: boolean
}

export function GenieLogo({ className, showSubtitle = true }: GenieLogoProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Logo with green/teal glow effect */}
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-electric-emerald/40 blur-2xl animate-pulse" />
        <div className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-electric-emerald via-electric-emerald to-dark-emerald flex items-center justify-center shadow-lg shadow-electric-emerald/50 border border-electric-emerald/30">
          <span className="text-4xl font-bold text-midnight-graphite">N</span>
        </div>
      </div>
      
      {/* AI text */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-electric-emerald">N AI</h2>
        {showSubtitle && (
          <p className="text-sm text-foreground/60 mt-2">
            Chat with your personal assistant without worrying about leaking private information
          </p>
        )}
      </div>
    </div>
  )
}

