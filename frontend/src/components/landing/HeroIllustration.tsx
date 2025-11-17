export function HeroIllustration() {
  return (
    <div className="relative w-full max-w-5xl mx-auto mt-16">
      {/* Background Pattern - Isometric Cubes */}
      <div className="absolute inset-0 opacity-10">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 800 600"
          className="absolute inset-0"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Isometric grid pattern */}
          {Array.from({ length: 12 }).map((_, i) => (
            <g key={i} transform={`translate(${(i % 4) * 200}, ${Math.floor(i / 4) * 200})`}>
              <path
                d="M0,100 L100,50 L200,100 L100,150 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-zec-indigo"
                opacity="0.3"
              />
              <path
                d="M0,100 L100,50 L100,150 L0,200 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-zec-indigo"
                opacity="0.2"
              />
              <path
                d="M100,50 L200,100 L200,200 L100,150 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-zec-indigo"
                opacity="0.2"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Background Icons */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Checkmark Icon - Left */}
        <div className="absolute left-[-20px] top-1/2 -translate-y-1/2 opacity-20">
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-electric-emerald"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Magnifying Glass Icon - Bottom Right */}
        <div className="absolute right-[-30px] bottom-[-30px] opacity-20">
          <svg
            width="100"
            height="100"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-zec-indigo"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>

        {/* Star Icon - Top Center */}
        <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 opacity-20">
          <svg
            width="60"
            height="60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-electric-emerald"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
      </div>

      {/* Cards Container */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        {/* Your Wallet Card */}
        <div className="bg-obsidian border-2 border-zec-indigo/50 rounded-2xl p-6 shadow-lg glow-indigo relative">
          {/* Purple Accent Circle */}
          <div className="absolute -top-3 -right-3 w-8 h-8 bg-zec-indigo rounded-full"></div>
          
          <h3 className="text-foreground text-lg font-semibold mb-4">Your Wallet</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-foreground/60 text-sm mb-1 block">Asset</label>
              <div className="text-foreground text-3xl font-bold">ZEC</div>
            </div>
            
            <div>
              <label className="text-foreground/60 text-sm mb-1 block">Amount</label>
              <div className="text-foreground text-3xl font-bold">2.5</div>
            </div>
          </div>
        </div>

        {/* Flow Line - Curved Connection */}
        <div className="hidden lg:block absolute left-1/3 top-1/2 -translate-y-1/2 w-1/3 z-0">
          <svg
            width="100%"
            height="100"
            viewBox="0 0 200 100"
            className="absolute"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
          >
            {/* Curved Path */}
            <path
              d="M 0 50 Q 100 20 200 50"
              fill="none"
              stroke="url(#flowGradient)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Gradient Definition */}
            <defs>
              <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4B5DFF" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#4B5DFF" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#4B5DFF" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            
            {/* Animated Dots */}
            <circle cx="50" cy="35" r="4" fill="#4B5DFF" opacity="0.8">
              <animate
                attributeName="cx"
                values="50;150;50"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="cy"
                values="35;50;35"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="100" cy="20" r="3" fill="#4B5DFF" opacity="0.6">
              <animate
                attributeName="cx"
                values="100;200;100"
                dur="2.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="cy"
                values="20;50;20"
                dur="2.5s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        </div>

        {/* Zero-Link Validation Card */}
        <div className="bg-obsidian border-2 border-electric-emerald/50 rounded-2xl p-6 shadow-lg glow-emerald relative">
          <h3 className="text-foreground text-lg font-semibold mb-4">Zero-Link</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-foreground/60 text-sm mb-1 block">UTXO Selection</label>
              <div className="text-electric-emerald text-2xl font-bold">Valid</div>
            </div>
            
            <button className="w-full mt-4 px-4 py-2 bg-electric-emerald/20 border border-electric-emerald/50 rounded-lg text-electric-emerald font-medium hover:bg-electric-emerald/30 transition-colors">
              Validate
            </button>
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-obsidian border-2 border-zec-indigo/50 rounded-2xl p-6 shadow-lg glow-indigo relative lg:col-start-3">
          <h3 className="text-foreground text-lg font-semibold mb-4">Action</h3>
          
          {/* Icon - Shield/Privacy Symbol */}
          <div className="flex justify-center mb-4">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-zec-indigo"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          
          <button className="w-full px-4 py-3 bg-zec-indigo rounded-lg text-white font-semibold hover:bg-deep-indigo transition-colors shadow-lg">
            Execute Privately
          </button>
        </div>
      </div>

      {/* Mobile Flow Line (Vertical) */}
      <div className="lg:hidden flex justify-center my-8">
        <div className="w-1 h-32 bg-gradient-primary rounded-full opacity-50 relative">
          {/* Animated dots for mobile */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-zec-indigo rounded-full animate-pulse"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-zec-indigo rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
    </div>
  );
}

