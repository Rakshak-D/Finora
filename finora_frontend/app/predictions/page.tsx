"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Activity, Cpu, Gauge, TrendingDown, TrendingUp } from "lucide-react"

import AppShell from "@/components/shared/AppShell"
import { EmptyState, InlineError, SkeletonBlock } from "@/components/shared/StateBlocks"
import { getPredictionsOverview, getSystemStatus } from "@/services/api"
import type { PredictionOverview, SystemStatus } from "@/lib/api/schemas"
import { APIError } from "@/lib/api/client"

function formatNumber(value?: number | null) {
  if (value == null) return "Unavailable"
  return value.toLocaleString("en-IN", { maximumFractionDigits: 2 })
}

export default function PredictionsPage() {
  const [overview, setOverview] = useState<PredictionOverview | null>(null)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadPredictions() {
      try {
        const [predictionResponse, systemResponse] = await Promise.all([
          getPredictionsOverview(),
          getSystemStatus().catch(() => null),
        ])

        if (!active) return

        setOverview(predictionResponse)
        setSystemStatus(systemResponse)
        setError(null)
      } catch (cause) {
        setError(cause instanceof APIError ? cause.message : "Prediction overview could not be loaded.")
      } finally {
        if (active) setLoading(false)
      }
    }

    loadPredictions()
    const interval = setInterval(loadPredictions, 60_000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  return (
    <AppShell>
      <div className="mt-6 space-y-6">
        <div className="rounded-[32px] hero-gradient border border-white/8 p-6">
          <p className="text-xs uppercase tracking-[0.34em] text-[#D9D3FF]">Predictions</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-3xl">
              <h1
                className="bg-gradient-to-r from-[#F8F9FF] via-[#D9D3FF] to-[#A594F9] bg-clip-text text-3xl font-black uppercase tracking-[0.12em] text-transparent"
                style={{ fontFamily: "var(--font-orbitron), sans-serif" }}
              >
                Momentum With Context
              </h1>
              <p className="mt-4 text-sm leading-7 text-[#cfc7eb]">
                These forecasts are generated from the live market snapshot and sector breadth proxies instead of hardcoded demo numbers.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              {overview?.summary || "Loading live prediction summary..."}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="glass-panel rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Prediction assets</p>
            <p className="mt-2 text-2xl font-semibold text-white">{overview?.assets.length ?? 0}</p>
          </div>
          <div className="glass-panel rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Sector signals</p>
            <p className="mt-2 text-2xl font-semibold text-white">{overview?.sectors.length ?? 0}</p>
          </div>
          <div className="glass-panel rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Inference mode</p>
            <p className="mt-2 text-2xl font-semibold text-white">{systemStatus?.pipeline_ready ? "Primary" : "Fallback"}</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="glass-panel rounded-[28px] p-6">
            <div className="mb-5 flex items-center gap-3">
              <Gauge className="h-5 w-5 text-[#A594F9]" />
              <h2 className="text-lg font-semibold text-white">Asset forecasts</h2>
            </div>

            <div className="space-y-3">
              {loading && !overview
                ? Array.from({ length: 4 }).map((_, index) => <SkeletonBlock key={`prediction-${index}`} className="h-40 w-full" />)
                : null}

              {overview?.assets.map((asset, index) => {
                const positive = (asset.projected_change_percent ?? 0) >= 0
                return (
                  <motion.div
                    key={asset.instrument_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-3xl border border-white/8 bg-white/4 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`rounded-2xl p-3 ${positive ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"}`}>
                          {positive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-white">{asset.display_name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">{asset.symbol}</p>
                        </div>
                      </div>

                      <div className="grid min-w-[260px] gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-xs text-slate-400">Current</p>
                          <p className="mt-1 text-sm font-semibold text-white">{formatNumber(asset.current_price)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Projected</p>
                          <p className="mt-1 text-sm font-semibold text-white">{formatNumber(asset.predicted_price)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Bias</p>
                          <p className={`mt-1 text-sm font-semibold ${positive ? "text-green-300" : "text-red-300"}`}>
                            {asset.projected_change_percent != null ? `${positive ? "+" : ""}${asset.projected_change_percent.toFixed(2)}%` : "Unavailable"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-300">{asset.rationale}</p>
                      <span className="rounded-full border border-[#A594F9]/20 bg-[#A594F9]/12 px-3 py-1 text-xs text-[#F8F9FF]">
                        {asset.confidence}% confidence
                      </span>
                    </div>
                  </motion.div>
                )
              })}

              {!overview?.assets.length && !loading ? (
                <EmptyState
                  title="No live forecasts yet"
                  description="Asset predictions will appear here once Finora receives a usable market snapshot from the quote provider."
                />
              ) : null}
              {error ? <InlineError message={error} actionLabel="Retry" onAction={() => window.location.reload()} /> : null}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel rounded-[28px] p-5">
              <div className="mb-4 flex items-center gap-3">
                <Activity className="h-5 w-5 text-[#D9D3FF]" />
                <h3 className="text-sm font-semibold text-white">Sector forecasts</h3>
              </div>
              <div className="space-y-3">
                {overview?.sectors.map((sector) => (
                  <div key={sector.key} className="rounded-2xl border border-white/8 bg-white/4 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{sector.name}</p>
                        <p className="mt-1 text-xs text-slate-400">{sector.horizon}</p>
                      </div>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs capitalize text-slate-200">
                        {sector.forecast_bias}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{sector.rationale}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                      <span>{sector.current_change_percent != null ? `${sector.current_change_percent.toFixed(2)}% current move` : "No current move"}</span>
                      <span>{sector.confidence}% confidence</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[28px] p-5">
              <div className="mb-4 flex items-center gap-3">
                <Cpu className="h-5 w-5 text-[#A594F9]" />
                <h3 className="text-sm font-semibold text-white">Runtime health</h3>
              </div>
              <div className="space-y-3">
                {systemStatus?.models.map((model) => (
                  <div key={model.name} className="rounded-2xl border border-white/8 bg-white/4 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold capitalize text-white">{model.name.replaceAll("_", " ")}</p>
                      <span className={`rounded-full px-3 py-1 text-xs ${model.ready ? "bg-green-500/12 text-green-200" : "bg-amber-500/12 text-amber-200"}`}>
                        {model.ready ? "ready" : "fallback"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">{model.provider}</p>
                    {model.detail ? <p className="mt-2 text-xs text-slate-500">{model.detail}</p> : null}
                  </div>
                ))}
                {!systemStatus ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
                    Runtime diagnostics will appear here once the API health contract responds.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
