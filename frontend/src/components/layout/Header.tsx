import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-midnight-graphite/80 backdrop-blur-md">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-zec-indigo rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">ZF</span>
            </div>
            <span className="text-lg font-semibold text-foreground">ZecFinder</span>
          </Link>

          {/* Navigation Links - Centered */}
          <div className="hidden lg:flex items-center space-x-6 absolute left-1/2 -translate-x-1/2">
            <Link
              to="/"
              className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
            >
              Home
            </Link>
            <div className="flex items-center space-x-1">
              <Link
                to="/solutions"
                className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
              >
                Solutions
              </Link>
              <svg
                className="w-4 h-4 text-foreground/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            <div className="flex items-center space-x-1">
              <Link
                to="/use-cases"
                className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
              >
                Use Cases
              </Link>
              <svg
                className="w-4 h-4 text-foreground/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            <div className="flex items-center space-x-1">
              <Link
                to="/community"
                className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
              >
                Community
              </Link>
              <svg
                className="w-4 h-4 text-foreground/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            <div className="flex items-center space-x-1">
              <Link
                to="/developers"
                className="text-foreground/80 hover:text-foreground transition-colors text-sm font-medium"
              >
                Developers
              </Link>
              <svg
                className="w-4 h-4 text-foreground/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* CTAs - Right Side */}
          <div className="flex items-center space-x-3">
            <Link
              to="/contact"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-zec-indigo border border-zec-indigo rounded-lg hover:bg-obsidian transition-colors"
            >
              Contact Us
            </Link>
            <Link
              to="/app"
              className="inline-flex px-4 py-2 text-sm font-medium text-white bg-zec-indigo rounded-lg hover:bg-deep-indigo transition-colors"
            >
              Enter Studio
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

