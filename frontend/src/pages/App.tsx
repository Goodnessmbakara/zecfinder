import { WalletManager } from "../components/app/WalletManager"
import { ChatInterface } from "../components/app/ChatInterface"

export function AppLayout() {
  return (
    <div className="min-h-screen bg-midnight-graphite p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">ZecFinder Agent</h1>
          <p className="text-gray-400">Autonomous Privacy-Preserving Zcash Agent</p>
        </header>

        <WalletManager />
        
        <ChatInterface />
      </div>
    </div>
  )
}

