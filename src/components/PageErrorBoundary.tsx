import { Component, type ReactNode } from 'react'
import { AlertTriangleIcon, ChevronDownIcon, RefreshIcon } from './Icons'

interface Props {
  children: ReactNode
  name: string
  onReset?: () => void
}

interface State {
  error: Error | null
  showDetails: boolean
}

export class PageErrorBoundary extends Component<Props, State> {
  state: State = { error: null, showDetails: false }

  static getDerivedStateFromError(error: Error): State {
    return { error, showDetails: false }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[PageErrorBoundary:${this.props.name}]`, error, info)
  }

  handleReset = () => {
    this.setState({ error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.error) {
      const e = this.state.error
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <AlertTriangleIcon size={32} className="text-amber-500" />
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              {this.props.name} — Something went wrong
            </h3>
            <p className="mt-1 max-w-md text-xs leading-relaxed dark:text-zinc-400">
              {e.message || 'An unexpected error occurred in this section'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400"
              onClick={this.handleReset}
            >
              <RefreshIcon size={12} /> Reset Page
            </button>
            <button
              className="rounded-lg border dark:border-zinc-700 px-3 py-1.5 text-xs font-semibold dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
          <button
            className="flex items-center gap-1 text-[10px] dark:text-zinc-600 hover:text-zinc-400"
            onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
          >
            <ChevronDownIcon size={10} className={this.state.showDetails ? 'rotate-180' : ''} /> Error Details
          </button>
          {this.state.showDetails && (
            <pre className="max-w-xl overflow-auto rounded-lg dark:bg-zinc-900 p-4 text-left text-[10px] leading-relaxed dark:text-zinc-500 border dark:border-zinc-800">
              {e.stack || e.message}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
