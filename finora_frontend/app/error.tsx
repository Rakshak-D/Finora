"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    void error
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F0C1D] px-4 text-[#F8F9FF]">
      <div className="glass-panel max-w-lg rounded-3xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/12 text-red-200">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold">Finora hit an unexpected issue</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          The page failed to load correctly. You can retry safely without losing the rest of the app.
        </p>
        <button onClick={reset} className="btn-primary mt-6 rounded-2xl px-5 py-3 text-sm">
          <span className="inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </span>
        </button>
        {error.digest ? <p className="mt-4 text-xs text-slate-500">Reference: {error.digest}</p> : null}
      </div>
    </div>
  )
}
