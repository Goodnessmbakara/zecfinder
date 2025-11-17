export function CTA() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="bg-obsidian border border-zec-indigo/30 rounded-3xl p-12 md:p-16 max-w-5xl mx-auto relative overflow-hidden">
        {/* Stripe/Box Design - Top Border Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-zec-indigo via-deep-indigo to-zec-indigo"></div>
        
        {/* Optional: Side accent stripe */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-zec-indigo/50 via-zec-indigo to-zec-indigo/50"></div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Headline */}
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
          Ready to Experience Private Intent Execution?
        </h2>

        {/* Sub-headline */}
        <p className="text-xl md:text-2xl text-foreground/90 mb-6 font-medium">
          Privacy-preserving autonomous agents are now programmable, verifiable, and ready for use in live, shielded systems.
        </p>

        {/* Body Text */}
        <p className="text-base md:text-lg text-foreground/70 mb-10 leading-relaxed max-w-3xl">
          If you're building with AI agent frameworks, exploring privacy-preserving automation, developing zero-knowledge crypto projects, or looking for infrastructure to support shielded web3 agents, ZecFinder is the execution layer that securely turns agent intent into private onchain action with zero correlation risk.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <a
            href="/app"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-zec-indigo rounded-lg hover:bg-deep-indigo transition-colors glow-indigo"
          >
            Start exploring →
          </a>
          <a
            href="/blog"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-foreground bg-obsidian border border-obsidian rounded-lg hover:bg-obsidian/80 transition-colors group"
          >
            Read the blog →
            <svg
              className="ml-2 w-5 h-5 text-zec-indigo group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
        </div>
        </div>
      </div>
    </section>
  );
}

