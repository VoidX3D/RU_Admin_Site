import { Component, type ReactNode } from 'react'
import { AlertTriangleIcon, ChevronDownIcon } from './Icons'

interface Props { children: ReactNode }
interface State { error: Error | null; showDetails: boolean }

export class ErrorBoundary extends Component<Props, State> {
 state: State = { error: null, showDetails: false }

 static getDerivedStateFromError(error: Error): State { return { error, showDetails: false } }

 componentDidCatch(error: Error, info: React.ErrorInfo) {
  console.error('ErrorBoundary caught:', error, info)
 }

 render() {
 if (this.state.error) {
 const e = this.state.error
 return (
 <div className="flex min-h-screen flex-col items-center justify-center gap-4 dark:bg-zinc-950 p-10 text-center">
  <AlertTriangleIcon size={40} className="text-red-500" />
  <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Something went wrong</h1>
  <p className="max-w-md text-sm leading-relaxed dark:text-zinc-400">
  {e.message || 'An unexpected error occurred'}
  </p>
  <div className="flex gap-3">
  <button
    className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
    onClick={() => this.setState({ error: null })}
  >
    Try Again
  </button>
  <button
    className="rounded-lg border dark:border-zinc-700 px-4 py-2 text-sm font-semibold dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
    onClick={() => window.location.reload()}
  >
    Reload Page
  </button>
  </div>
  <button
  className="flex items-center gap-1 text-[10px] dark:text-zinc-600 hover:text-zinc-400 mt-2"
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
