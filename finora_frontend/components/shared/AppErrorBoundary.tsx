"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"
import { Component, type ReactNode } from "react"

type State = {
  hasError: boolean
}

export default class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch() {}

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0F0C1D] px-4 text-[#F8F9FF]">
          <div className="glass-panel max-w-lg rounded-3xl p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/12 text-red-200">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold">Something broke in the UI</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Finora hit an unexpected rendering problem. Refreshing the page usually resolves it.
            </p>
            <button onClick={() => window.location.reload()} className="btn-primary mt-6 rounded-2xl px-5 py-3 text-sm">
              <span className="inline-flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Reload app
              </span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
