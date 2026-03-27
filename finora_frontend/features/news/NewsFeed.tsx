"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ExternalLink, Gauge, Newspaper, Search, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"

import Panel from "../../components/Panel"
import CoachBriefPanel from "@/components/coach/CoachBriefPanel"
import SignalSphere from "@/components/immersive/SignalSphere"
import { EmptyState, InlineError, SkeletonBlock } from "@/components/shared/StateBlocks"
import { useNewsInsight, usePrefetchNewsInsight } from "@/hooks/useNewsInsight"
import { getNews } from "@/services/api"

function relativeTime(value?: string | null) {
  if (!value) return "Live"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Live"
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000))
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function urgencyStyles(urgency: string) {
  if (urgency === "high") return "border-red-400/25 bg-red-500/10 text-red-200"
  if (urgency === "medium") return "border-amber-400/25 bg-amber-500/10 text-amber-200"
  return "border-[#A594F9]/25 bg-[#A594F9]/10 text-[#F8F9FF]"
}

export default function NewsFeed() {
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null)
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<"latest" | "urgency" | "source">("latest")
  const prefetchInsight = usePrefetchNewsInsight()

  const newsQuery = useQuery({
    queryKey: ["news-live", page, query, sort],
    queryFn: () => getNews({ page, pageSize: 8, q: query || undefined, sort }),
    staleTime: 45_000,
  })

  const articles = newsQuery.data?.items ?? []
  const newsMeta = newsQuery.data?.meta
  const selectedArticleId = activeArticleId ?? articles[0]?.id ?? null
  const insightQuery = useNewsInsight(selectedArticleId)
  const insight = insightQuery.data

  const activeReason = useMemo(() => {
    if (!insight || !activeNodeId) return null
    return insight.graph.edges.find((edge) => edge.target === activeNodeId || edge.source === activeNodeId)?.reason ?? null
  }, [activeNodeId, insight])

  return (
    <Panel title="Story-to-Market Feed">
      <div className="grid gap-5 xl:grid-cols-[1.05fr_1.4fr]">
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-[#D9D3FF]" />
                <span className="text-sm font-medium text-white">Live headlines with coaching signals</span>
              </div>
              <span className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Hover to prefetch</span>
            </div>

            <div className="mb-4 flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={query}
                  onChange={(event) => {
                    setPage(1)
                    setQuery(event.target.value)
                  }}
                  placeholder="Search source, title, or entities"
                  className="input-glass w-full rounded-2xl py-3 pl-10 pr-4 text-sm text-white"
                />
              </div>
              <select
                value={sort}
                onChange={(event) => {
                  setPage(1)
                  setSort(event.target.value as "latest" | "urgency" | "source")
                }}
                className="input-glass rounded-2xl px-4 py-3 text-sm text-white"
              >
                <option value="latest">Latest</option>
                <option value="urgency">Urgency</option>
                <option value="source">Source</option>
              </select>
            </div>

            <div className="space-y-3">
              {newsQuery.isLoading
                ? Array.from({ length: 4 }).map((_, index) => <SkeletonBlock key={`news-skeleton-${index}`} className="h-36 w-full" />)
                : null}

              {articles.map((article, index) => {
                const active = article.id === selectedArticleId
                return (
                  <motion.button
                    key={article.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onMouseEnter={() => prefetchInsight(article.id)}
                    onFocus={() => prefetchInsight(article.id)}
                    onClick={() => {
                      setActiveArticleId(article.id)
                      setActiveNodeId("story")
                    }}
                    className={`news-card w-full rounded-2xl border p-4 text-left transition-all ${
                      active
                        ? "border-[#A594F9]/40 bg-[#A594F9]/10 shadow-[0_0_0_1px_rgba(165,148,249,0.2)]"
                        : "border-white/8 bg-white/4 hover:border-white/18 hover:bg-white/7"
                    }`}
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-slate-400">
                      <span>{article.source}</span>
                      <span>{relativeTime(article.published_at || article.fetched_at)}</span>
                    </div>
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h3 className="text-sm font-semibold leading-6 text-white">{article.title}</h3>
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${urgencyStyles(article.urgency)}`}>
                        {article.urgency}
                      </span>
                    </div>
                    <p className="mb-3 text-sm leading-6 text-slate-300">{article.beginner_summary}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {article.entities.slice(0, 3).map((entity) => (
                        <span key={entity} className="rounded-full bg-white/6 px-2 py-1 text-[11px] text-slate-300">
                          {entity}
                        </span>
                      ))}
                    </div>
                  </motion.button>
                )
              })}

              {newsQuery.isError ? <InlineError message="Finora could not load the live news feed." actionLabel="Retry" onAction={() => newsQuery.refetch()} /> : null}
              {!articles.length && !newsQuery.isLoading && !newsQuery.isError ? (
                <EmptyState
                  title="No stories match this view"
                  description="Try a different search phrase or switch the sort mode to bring more live coverage into view."
                />
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                {newsMeta ? `Page ${newsMeta.page} of ${newsMeta.total_pages}` : "Loading pagination"}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={!newsMeta?.has_previous}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((current) => current + 1)}
                  disabled={!newsMeta?.has_next}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {insight ? (
            <>
              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <SignalSphere insight={insight} activeNodeId={activeNodeId} onNodeSelect={setActiveNodeId} />
                <CoachBriefPanel insight={insight} activeNodeReason={activeReason} />
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr]">
                <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-[#D9D3FF]">Selected Story</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">{insight.headline}</h3>
                    </div>
                    {insight.source_url ? (
                      <a
                        href={insight.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/6"
                      >
                        Source
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>

                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-xs ${urgencyStyles(insight.urgency)}`}>{insight.should_care.replaceAll("_", " ")}</span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-green-400/15 bg-green-500/10 px-2.5 py-1 text-xs text-green-200">
                      <Gauge className="h-3.5 w-3.5" />
                      {insight.confidence.toFixed(1)}% confidence
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-xs text-slate-300">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {insight.source_name}
                    </span>
                  </div>

                  <p className="text-sm leading-7 text-slate-300">{insight.beginner_summary}</p>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
                  <p className="mb-3 text-xs uppercase tracking-[0.3em] text-slate-400">Historical analogs</p>
                  <div className="space-y-3">
                    {insight.historical_parallels.length ? (
                      insight.historical_parallels.map((item) => (
                        <div key={item.title} className="rounded-xl border border-white/8 bg-white/4 p-3">
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-white">{item.title}</p>
                            <span className="text-xs text-[#D9D3FF]">{Math.round(item.similarity * 100)}% match</span>
                          </div>
                          <p className="text-xs leading-6 text-slate-400">{item.outcome}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">No close historical match was found for this article yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : insightQuery.isLoading ? (
            <div className="space-y-4">
              <SkeletonBlock className="h-[420px] w-full" />
              <SkeletonBlock className="h-52 w-full" />
            </div>
          ) : (
            <EmptyState
              title="Select a headline"
              description="Open a live story to generate a beginner-safe summary, confidence signal, and visual Signal Sphere."
            />
          )}
        </div>
      </div>
    </Panel>
  )
}
