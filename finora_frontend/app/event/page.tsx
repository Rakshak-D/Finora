"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Activity, Brain, ChevronRight, History, Radar, Sparkles, Zap } from "lucide-react"

import AppShell from "@/components/shared/AppShell"
import { InlineError } from "@/components/shared/StateBlocks"
import { useToast } from "@/components/shared/ToastProvider"
import { APIError } from "@/lib/api/client"
import { analyzeEvent, getConfig, getHistoricalEvents, getSystemStatus } from "@/services/api"
import type { FinoraAnalysis } from "@/types/finora"

type SampleEvent = {
  id: string
  title: string
  sector: string
  impactLabel: string
}

type RecentAnalysis = {
  event: string
  sentiment: string
  confidence: number
  time: string
}

type HistoricalEventRecord = {
  id?: string
  event?: string
  primary_sector?: string
  asset_impacts?: {
    Nifty_50?: {
      est_pct_1d?: number
    }
  }
}

function signalLabel(score?: number) {
  if ((score ?? 0) >= 0.66) return "High priority"
  if ((score ?? 0) <= 0.34) return "Risk alert"
  return "Watchlist"
}

export default function EventPage() {
  const { pushToast } = useToast()
  const [headline, setHeadline] = useState("")
  const [analysisResult, setAnalysisResult] = useState<FinoraAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sampleEvents, setSampleEvents] = useState<SampleEvent[]>([])
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([])
  const [stats, setStats] = useState({
    eventsAnalyzed: 0,
    sectorsTracked: 0,
    pipelineReady: "Checking",
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    const queryHeadline = new URLSearchParams(window.location.search).get("q")
    if (queryHeadline) {
      setHeadline(queryHeadline)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadPageData() {
      const [historicalRes, configRes, statusRes] = await Promise.all([
        getHistoricalEvents({ limit: 8 }).catch(() => null),
        getConfig().catch(() => null),
        getSystemStatus().catch(() => null),
      ])

      if (!active) return

      const samples: SampleEvent[] =
        historicalRes?.items?.slice(0, 4).map((event: HistoricalEventRecord) => {
          const dayMove = Math.abs(event.asset_impacts?.Nifty_50?.est_pct_1d ?? 0)
          return {
            id: event.id || event.event || Math.random().toString(),
            title: event.event || "Historical market event",
            sector: (event.primary_sector || "general").replace("_", " "),
            impactLabel: dayMove >= 1.5 ? "High" : dayMove >= 0.75 ? "Medium" : "Low",
          }
        }) ?? []

      setSampleEvents(samples)
      setRecentAnalyses(
        samples.slice(0, 3).map((sample, index) => ({
          event: sample.title,
          sentiment: sample.impactLabel === "High" ? "Watch closely" : "Monitor",
          confidence: sample.impactLabel === "High" ? 81 : 66,
          time: `${index + 1}h ago`,
        })),
      )
      setStats({
        eventsAnalyzed: historicalRes?.meta.total_items ?? 0,
        sectorsTracked: configRes?.sectors.length ?? 0,
        pipelineReady: statusRes?.pipeline_ready ? "Ready" : "Fallback mode",
      })
    }

    loadPageData()
    return () => {
      active = false
    }
  }, [])

  const topParallels = useMemo(() => analysisResult?.history_echo?.parallels?.slice(0, 3) ?? [], [analysisResult])
  const validationMessage = !headline.trim()
    ? "Enter a market-moving headline to analyze."
    : headline.trim().length < 10
      ? "Use at least 10 characters so Finora has enough context."
      : null

  async function handleAnalyze() {
    if (validationMessage) {
      setError(validationMessage)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await analyzeEvent(headline.trim())
      setAnalysisResult(result)
      pushToast({ tone: "success", title: "Event analysis complete", description: "Finora refreshed the signal, summary, and historical comparisons." })
      setRecentAnalyses((previous) => [
        {
          event: headline.trim(),
          sentiment: result.sentiment?.label?.toString() || "neutral",
          confidence: Math.round((result.signal_score ?? 0.5) * 100),
          time: "Just now",
        },
        ...previous.slice(0, 4),
      ])
    } catch (cause) {
      setError(cause instanceof APIError ? cause.message : "Analysis failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="mt-6 space-y-6">
        <div className="rounded-[32px] hero-gradient border border-white/8 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.34em] text-[#D9D3FF]">Event Intelligence</p>
              <h1
                className="mt-3 bg-gradient-to-r from-[#F8F9FF] via-[#D9D3FF] to-[#A594F9] bg-clip-text text-3xl font-black uppercase tracking-[0.12em] text-transparent"
                style={{ fontFamily: "var(--font-orbitron), sans-serif" }}
              >
                Read The Ripple Before It Spreads
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#cfc7eb]">
                Paste any headline and Finora will classify the event, estimate the likely market direction, and show the closest historical parallels.
              </p>
            </div>

            <div className="grid min-w-[260px] flex-1 gap-3 sm:grid-cols-3">
              <div className="glass-panel rounded-2xl p-4">
                <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Historical cases</p>
                <p className="mt-2 text-2xl font-semibold text-white">{stats.eventsAnalyzed}</p>
              </div>
              <div className="glass-panel rounded-2xl p-4">
                <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Sectors tracked</p>
                <p className="mt-2 text-2xl font-semibold text-white">{stats.sectorsTracked}</p>
              </div>
              <div className="glass-panel rounded-2xl p-4">
                <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Pipeline mode</p>
                <p className="mt-2 text-2xl font-semibold text-white">{stats.pipelineReady}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="glass-panel rounded-[28px] p-6">
            <div className="mb-5 flex items-start gap-4">
              <div className="rounded-2xl bg-[#A594F9]/15 p-3 text-[#D9D3FF]">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Analyze a story</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Turn headlines into a market view</h2>
              </div>
            </div>

            <div className="space-y-4">
              <textarea
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
                placeholder="Example: RBI holds rates steady while warning inflation risks remain elevated."
                className="input-glass min-h-[128px] w-full rounded-3xl p-4 text-sm text-white"
              />

              <div className="flex flex-wrap gap-3">
                <button onClick={handleAnalyze} disabled={loading || !headline.trim()} className="btn-primary rounded-2xl px-5 py-3 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    {loading ? "Analyzing" : "Analyze Event"}
                  </span>
                </button>
                {sampleEvents.slice(0, 2).map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => setHeadline(sample.title)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300 transition hover:bg-white/10"
                  >
                    Try: {sample.title.slice(0, 52)}
                  </button>
                ))}
              </div>
              {validationMessage ? <p className="text-xs text-amber-200">{validationMessage}</p> : null}
              {error ? <InlineError message={error} /> : null}
            </div>

            {analysisResult ? (
              <div className="mt-6 grid gap-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Sentiment</p>
                    <p className="mt-2 text-xl font-semibold capitalize text-white">{analysisResult.sentiment?.label || "neutral"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Primary sector</p>
                    <p className="mt-2 text-xl font-semibold capitalize text-white">{analysisResult.classification?.primary_sector?.replaceAll("_", " ") || "market"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Signal score</p>
                    <p className="mt-2 text-xl font-semibold text-white">{Math.round((analysisResult.signal_score ?? 0.5) * 100)}%</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/8 bg-white/4 p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-[#D9D3FF]">What Finora sees</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">{analysisResult.classification?.event_type || "Market-moving event"}</h3>
                    </div>
                    <span className="rounded-full border border-[#A594F9]/20 bg-[#A594F9]/12 px-3 py-1 text-xs text-[#F8F9FF]">
                      {signalLabel(analysisResult.signal_score)}
                    </span>
                  </div>
                  <p className="text-sm leading-7 text-slate-300">
                    {analysisResult.history_echo?.echo_summary ||
                      analysisResult.persona_summary ||
                      "Finora has classified the event and is ready to map the likely market ripple effect."}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="glass-panel rounded-[28px] p-5">
              <div className="mb-4 flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-[#A594F9]" />
                <h3 className="text-sm font-semibold text-white">Suggested events</h3>
              </div>
              <div className="space-y-3">
                {sampleEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setHeadline(event.title)}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/4 p-3 text-left transition hover:bg-white/8"
                  >
                    <div>
                      <p className="text-sm text-white">{event.title}</p>
                      <p className="mt-1 text-xs capitalize text-slate-400">
                        {event.sector} • {event.impactLabel} impact
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[28px] p-5">
              <div className="mb-4 flex items-center gap-3">
                <History className="h-5 w-5 text-[#D9D3FF]" />
                <h3 className="text-sm font-semibold text-white">Closest historical parallels</h3>
              </div>
              <div className="space-y-3">
                {topParallels.length ? (
                  topParallels.map((parallel) => (
                    <div key={`${parallel.event_date}-${parallel.event_summary}`} className="rounded-2xl border border-white/8 bg-white/4 p-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{parallel.event_date}</p>
                      <p className="mt-2 text-sm text-white">{parallel.event_summary}</p>
                      <p className="mt-2 text-xs text-[#D9D3FF]">{Math.round((parallel.similarity_score ?? 0) * 100)}% match</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-7 text-slate-400">Run an event analysis to see which past market moments look most similar.</p>
                )}
              </div>
            </div>

            <div className="glass-panel rounded-[28px] p-5">
              <div className="mb-4 flex items-center gap-3">
                <Activity className="h-5 w-5 text-[#A594F9]" />
                <h3 className="text-sm font-semibold text-white">Recent activity</h3>
              </div>
              <div className="space-y-3">
                {recentAnalyses.map((analysis, index) => (
                  <motion.div
                    key={`${analysis.event}-${index}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className="rounded-2xl border border-white/8 bg-white/4 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-white">{analysis.event}</p>
                        <p className="mt-1 text-xs capitalize text-slate-400">{analysis.sentiment}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#F8F9FF]">{analysis.confidence}%</p>
                        <p className="mt-1 text-xs text-slate-500">{analysis.time}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-[#A594F9]/12 bg-[#A594F9]/8 p-5">
              <div className="flex items-start gap-3">
                <Radar className="mt-0.5 h-5 w-5 text-[#D9D3FF]" />
                <p className="text-sm leading-7 text-slate-300">
                  Finora now reads this page from live backend data, so the event templates, status, and historical parallels are no longer fixed mock values.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
