import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error('BuildIt4Me crashed', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen items-center justify-center bg-slate-50 p-8 text-center dark:bg-slate-900">
          <div className="max-w-md space-y-2">
            <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              Something broke in the shell
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {String(this.state.error?.message || this.state.error)}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
