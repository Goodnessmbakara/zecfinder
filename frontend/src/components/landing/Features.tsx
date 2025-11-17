interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'indigo' | 'emerald';
}

const features: Feature[] = [
  {
    title: 'Zero-Link Routing',
    description: 'Automatic UTXO selection avoiding traceability',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: 'indigo',
  },
  {
    title: 'Autonomous Agent Engine',
    description: 'Context-aware intent parsing and execution',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: 'emerald',
  },
  {
    title: 'Privacy by Default',
    description: 'All transactions use Zcash shielded pools',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    color: 'indigo',
  },
  {
    title: 'Dark Mode UI',
    description: 'Cryptographic confidence with modern minimalism',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
    color: 'emerald',
  },
];

export function Features() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-4">Core Features</h2>
        <p className="text-foreground/60 max-w-2xl mx-auto">
          Built for privacy, designed for autonomy
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-obsidian border border-zec-indigo/30 rounded-xl p-6 hover:border-zec-indigo/60 transition-colors"
          >
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                feature.color === 'indigo'
                  ? 'bg-zec-indigo/20 text-zec-indigo'
                  : 'bg-electric-emerald/20 text-electric-emerald'
              }`}
            >
              {feature.icon}
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {feature.title}
            </h3>
            <p className="text-sm text-foreground/60 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

