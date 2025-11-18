import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined)

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("flex gap-1", className)}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
}

function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error("TabsTrigger must be used within Tabs")
  }

  const isActive = context.value === value

  return (
    <button
      onClick={() => context.onValueChange(value)}
      className={cn(
        "px-4 py-2 text-sm font-medium transition-colors",
        "border-b-2 border-transparent",
        isActive
          ? "border-zec-indigo text-foreground"
          : "text-foreground/60 hover:text-foreground/80",
        className
      )}
    >
      {children}
    </button>
  )
}

export { Tabs, TabsList, TabsTrigger }

