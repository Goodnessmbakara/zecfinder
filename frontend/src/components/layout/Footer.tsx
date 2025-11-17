import { Link } from 'react-router-dom';

export function Footer() {
  const socialLinks = [
    {
      name: 'Twitter/X',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      href: 'https://twitter.com/zecfinder',
    },
    {
      name: 'Discord',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C2.451 6.018 1.95 7.765 1.95 9.54c0 5.163 3.26 9.675 7.927 10.548a.074.074 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928-1.793 6.4-5.38 6.4-9.465 0-1.775-.5-3.522-1.695-5.143a.066.066 0 0 0-.031-.03zM8.02 15.33a1.125 1.125 0 0 1-1.069-1.236 1.123 1.123 0 0 1 1.236-1.069 1.125 1.125 0 0 1 1.07 1.236 1.123 1.123 0 0 1-1.237 1.069zm7.975 0a1.125 1.125 0 0 1-1.07-1.236 1.123 1.123 0 0 1 1.237-1.069 1.125 1.125 0 0 1 1.069 1.236 1.123 1.123 0 0 1-1.236 1.069z" />
        </svg>
      ),
      href: 'https://discord.gg/zecfinder',
    },
    {
      name: 'YouTube',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
      href: 'https://youtube.com/@zecfinder',
    },
    {
      name: 'LinkedIn',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      href: 'https://linkedin.com/company/zecfinder',
    },
    {
      name: 'GitHub',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      ),
      href: 'https://github.com/zecfinder',
    },
    {
      name: 'Email',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      href: 'mailto:contact@zecfinder.io',
    },
    {
      name: 'RSS',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796 0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795.001 3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966 11.022 11.009h4.817c-.062-8.71-7.118-15.758-15.839-15.82zm0-7.18v4.81c9.84.084 17.848 8.094 17.928 17.937h4.817c-.09-12.65-10.095-22.655-22.745-22.747z" />
        </svg>
      ),
      href: '/rss',
    },
  ];

  return (
    <footer className="bg-midnight-graphite">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top Section: Logo, Links, Social, Language */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 pb-8">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-zec-indigo rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">ZF</span>
            </div>
            <span className="text-lg font-semibold text-foreground">ZecFinder</span>
          </Link>

          {/* Center: Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 lg:gap-8">
            <Link
              to="/"
              className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
            >
              Home
            </Link>
            <Link
              to="/team"
              className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
            >
              Team
            </Link>
            <Link
              to="/blog"
              className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
            >
              Blog
            </Link>
            <Link
              to="/docs"
              className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
            >
              Docs
            </Link>
            <Link
              to="/jobs"
              className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
            >
              Jobs
            </Link>
            <Link
              to="/media-kit"
              className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
            >
              Media Kit
            </Link>
          </nav>

          {/* Right: Social Icons and Language */}
          <div className="flex items-center gap-6">
            {/* Social Media Icons */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/60 hover:text-zec-indigo transition-colors"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>

            {/* Language Selector */}
            <div className="flex items-center relative">
              <select
                className="bg-transparent border-none text-foreground/80 hover:text-foreground text-sm font-medium focus:outline-none cursor-pointer appearance-none pr-6"
                defaultValue="en"
              >
                <option value="en" className="bg-obsidian">English</option>
                <option value="es" className="bg-obsidian">Español</option>
                <option value="fr" className="bg-obsidian">Français</option>
              </select>
              <svg
                className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/60 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom: Copyright */}
        <div className="pt-8">
          <p className="text-foreground/60 text-sm text-center">
            © 2025 ZecFinder. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

