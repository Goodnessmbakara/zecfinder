import { AppHeader } from "./AppHeader"
import { Sidebar } from "./Sidebar"
import { ChatInterface } from "./ChatInterface"

export function AppLayout() {
  return (
    <div className="h-screen flex flex-col bg-midnight-graphite">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <ChatInterface />
        </main>
      </div>
    </div>
  )
}

