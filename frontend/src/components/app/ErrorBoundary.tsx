import { Component } from "react"
import type { ErrorInfo, ReactNode } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
          <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h2 className="text-lg font-semibold text-red-500">Something went wrong</h2>
            </div>
            
            <p className="text-sm text-foreground/80 mb-4">
              {this.state.error?.message || "An unexpected error occurred. Please try again."}
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="mb-4">
                <summary className="text-xs text-foreground/60 cursor-pointer mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs bg-obsidian p-3 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <Button
              onClick={this.handleReset}
              className="w-full bg-zec-indigo hover:bg-deep-indigo"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

