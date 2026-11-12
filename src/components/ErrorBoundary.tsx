import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/** Keeps one broken component from blanking the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error): void {
    console.error('App crashed:', error)
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-100">
          <div className="max-w-md rounded-xl border border-red-500/40 bg-zinc-900 p-5">
            <h1 className="text-lg font-semibold">Something broke</h1>
            <p className="mt-2 text-sm text-zinc-400">{this.state.error.message}</p>
            <button
              onClick={() => {
                this.setState({ error: null })
                window.location.reload()
              }}
              className="mt-4 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400"
            >
              Reload the app
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
