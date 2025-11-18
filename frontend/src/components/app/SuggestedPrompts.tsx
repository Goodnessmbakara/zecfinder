import { cn } from "@/lib/utils"

interface SuggestedPromptsProps {
  onPromptClick: (prompt: string) => void
  className?: string
}

interface PromptCard {
  title: string
  subtitle: string
  prompt: string
}

const prompts: PromptCard[] = [
  {
    title: "Give me ideas",
    subtitle: "for what to do with my kids' art",
    prompt: "Give me creative ideas for what to do with my kids' art projects"
  },
  {
    title: "Overcome procrastination",
    subtitle: "give me tips",
    prompt: "Give me tips to overcome procrastination"
  },
  {
    title: "Show me a code snippet",
    subtitle: "of a website's sticky header",
    prompt: "Show me a code snippet for a website's sticky header"
  },
  {
    title: "Send 0.1 ZEC",
    subtitle: "to Alice privately",
    prompt: "Send 0.1 ZEC to Alice privately"
  },
  {
    title: "Check my balance",
    subtitle: "across all chains",
    prompt: "What's my private balance across all chains?"
  },
  {
    title: "Shield my ZEC",
    subtitle: "move to shielded pool",
    prompt: "Shield my ZEC and move it to the shielded pool"
  }
]

export function SuggestedPrompts({
  onPromptClick,
  className,
}: SuggestedPromptsProps) {
  return (
    <div className={cn("w-full", className)}>
      <p className="text-foreground/60 text-sm mb-4 text-center">⚡ Suggested</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onPromptClick(prompt.prompt)}
            className={cn(
              "text-left p-4 rounded-xl",
              "bg-obsidian/50 border border-obsidian/50",
              "hover:bg-obsidian hover:border-electric-emerald/30",
              "transition-all duration-200",
              "group cursor-pointer"
            )}
          >
            <h3 className="text-foreground font-medium mb-1 group-hover:text-electric-emerald transition-colors">
              {prompt.title}
            </h3>
            <p className="text-sm text-foreground/60">
              {prompt.subtitle}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

