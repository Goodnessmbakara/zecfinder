import { HeroIllustration } from './HeroIllustration';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Video Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="https://cdn.sp-assets.net/videos/hero-v8-desktop.mp4" type="video/mp4" />
        </video>
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-midnight-graphite/60"></div>
      </div>

      {/* Background Waves - Optional overlay if needed */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-30">
        <div className="absolute top-[240px] left-0 right-0 w-full h-full">
          <svg
            width="1440"
            height="849"
            viewBox="0 0 1440 849"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute w-full h-full"
          >
            <path
              d="M0 200C200 150 400 100 600 120C800 140 1000 180 1200 200C1400 220 1440 200 1440 200V849H0V200Z"
              fill="url(#gradient1)"
            />
            <defs>
              <linearGradient id="gradient1" x1="0" y1="0" x2="1440" y2="849" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4B5DFF" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#2C3EE8" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex flex-col items-center gap-y-7 max-w-4xl mx-auto">
          {/* Title */}
          <div className="w-full lg:w-8/12">
            <h1 className="text-[28px] sm:text-[40px] font-bold leading-[36px] sm:leading-[52px] text-gradient-primary">
              Privacy-Preserving Autonomous Agent Wallet for Zcash
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-base font-normal leading-normal w-full md:w-3/4 lg:w-2/5 text-foreground/60">
            Execute cryptocurrency intents privately, efficiently, and with zero correlation risk. Zero-link routing ensures untraceable transactions.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <a
              href="/app"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-zec-indigo rounded-lg hover:bg-deep-indigo transition-colors glow-indigo"
            >
              Launch App
            </a>
            <a
              href="/docs"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-zec-indigo border border-zec-indigo rounded-lg hover:bg-obsidian transition-colors"
            >
              View Documentation
            </a>
          </div>

          {/* Hero Illustration */}
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
}
