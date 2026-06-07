import { Component, type ReactNode } from 'react'
import { AlertTriangleIcon } from './Icons'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State { return { error } }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 p-10 text-center">
          <AlertTriangleIcon size={40} className="text-red-400" />
          <h1 className="text-xl font-bold text-white">Something went wrong</h1>
          <p className="max-w-md text-sm leading-relaxed text-zinc-500">
            {this.state.error.message}
          </p>
          <button
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
            onClick={() => { this.setState({ error: null }); window.location.reload() }}
          >
            Reload Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
