interface UseCase {
  title: string;
  description: string;
  icon: string;
  color: string;
}

const useCases: UseCase[] = [
  {
    title: 'Private Transfers',
    description: 'Send ZEC without revealing transaction linkage or identity',
    icon: '🔒',
    color: 'zec-indigo',
  },
  {
    title: 'Zero-Link Routing',
    description: 'Automatic UTXO selection prevents transaction graph analysis',
    icon: '🛡️',
    color: 'electric-emerald',
  },
  {
    title: 'Intent Execution',
    description: 'Natural language commands for autonomous, private actions',
    icon: '🤖',
    color: 'zec-indigo',
  },
  {
    title: 'Shielded Pool Operations',
    description: 'Move funds to shielded pools automatically and privately',
    icon: '✨',
    color: 'electric-emerald',
  },
];

export function UseCases() {
  return (
    <section className="container flex flex-col gap-y-8 mb-16 md:mb-24 lg:mb-24 xl:mb-24 2xl:mb-32 mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col gap-y-2.5">
        <h2 className="text-center text-2xl font-bold leading-8 text-foreground">
          ZecFinder Use Cases
        </h2>
        <p className="text-base font-normal leading-normal text-center opacity-60 text-foreground/60">
          Privacy-preserving autonomous agents that execute Zcash transactions with zero-link routing, ensuring complete transaction unlinkability.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {useCases.map((useCase, index) => (
          <div
            key={index}
            className="bg-obsidian border border-zec-indigo/30 rounded-xl p-6 hover:border-zec-indigo/60 transition-colors"
          >
            <div className={`text-4xl mb-4 ${useCase.color === 'zec-indigo' ? 'text-zec-indigo' : 'text-electric-emerald'}`}>
              {useCase.icon}
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {useCase.title}
            </h3>
            <p className="text-sm text-foreground/60 leading-relaxed">
              {useCase.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

