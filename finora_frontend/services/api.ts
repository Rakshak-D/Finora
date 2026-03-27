import type { InvestorPersona, FinoraAnalysis } from "../types/finora"
import { apiFetch } from "@/lib/api/client"
import {
  configSchema,
  dashboardOverviewSchema,
  paginatedHistoricalEventsResponseSchema,
  paginatedNewsResponseSchema,
  marketCandleResponseSchema,
  marketSnapshotSchema,
  newsInsightSchema,
  predictionOverviewSchema,
  sectorSnapshotResponseSchema,
  systemStatusSchema,
  type ConfigResponse,
  type DashboardOverview,
  type HistoricalEventSummary,
  type MarketCandleResponse,
  type MarketSnapshot,
  type NewsInsight,
  type PaginatedHistoricalEventsResponse,
  type PaginatedNewsResponse,
  type PredictionOverview,
  type SectorSnapshotResponse,
  type SystemStatus,
} from "@/lib/api/schemas"

const marketDataAdapter = {
  parse(snapshot: MarketSnapshot) {
    return {
      indices: snapshot.instruments.map((instrument) => ({
        symbol: instrument.id,
        name: instrument.display_name,
        price: instrument.price,
        change: instrument.change,
        changePercent: instrument.change_percent,
        volume: null,
        high: instrument.sparkline.length ? Math.max(...instrument.sparkline) : null,
        low: instrument.sparkline.length ? Math.min(...instrument.sparkline) : null,
        sparkline: instrument.sparkline,
        status: instrument.status,
      })),
      last_updated: snapshot.last_updated,
    }
  },
}

export async function analyzeEvent(text: string, persona?: InvestorPersona | null): Promise<FinoraAnalysis> {
  return apiFetch<FinoraAnalysis>("/api/analyze_event", {
    method: "POST",
    body: JSON.stringify({
      event: { text, deep_analysis: true },
      persona: persona ?? null,
    }),
  })
}

export async function analyzeEventAPI(text: string, persona?: InvestorPersona | null) {
  return analyzeEvent(text, persona)
}

export async function getMarketSnapshot(watchlist?: string[]) {
  const query = watchlist?.length ? `?watchlist=${encodeURIComponent(watchlist.join(","))}` : ""
  return apiFetch<MarketSnapshot>(`/api/market/snapshot${query}`, { schema: marketSnapshotSchema })
}

export async function getMarketCandles(instrument: string, interval: string = "1d") {
  return apiFetch<MarketCandleResponse>(
    `/api/market/candles?instrument=${encodeURIComponent(instrument)}&interval=${encodeURIComponent(interval)}`,
    { schema: marketCandleResponseSchema },
  )
}

export async function getMarketData() {
  const snapshot = await getMarketSnapshot()
  return marketDataAdapter.parse(snapshot)
}

export async function getNews(options?: { page?: number; pageSize?: number; q?: string; sort?: "latest" | "urgency" | "source" }) {
  const params = new URLSearchParams()
  if (options?.page) params.set("page", String(options.page))
  if (options?.pageSize) params.set("page_size", String(options.pageSize))
  if (options?.q) params.set("q", options.q)
  if (options?.sort) params.set("sort", options.sort)
  const query = params.toString()
  return apiFetch<PaginatedNewsResponse>(`/api/news/live${query ? `?${query}` : ""}`, { schema: paginatedNewsResponseSchema })
}

export async function getNewsInsight(articleId: string) {
  return apiFetch<NewsInsight>("/api/news/insight", {
    method: "POST",
    body: JSON.stringify({ article_id: articleId }),
    schema: newsInsightSchema,
  })
}

export async function getHistoricalEvents(options: { page?: number; pageSize?: number; limit?: number; q?: string } = {}) {
  const params = new URLSearchParams()
  if (options.page) params.set("page", String(options.page))
  if (options.pageSize) params.set("page_size", String(options.pageSize))
  if (options.limit) params.set("limit", String(options.limit))
  if (options.q) params.set("q", options.q)
  const query = params.toString()
  return apiFetch<PaginatedHistoricalEventsResponse>(`/api/historical-events${query ? `?${query}` : ""}`, {
    schema: paginatedHistoricalEventsResponseSchema,
  })
}

export async function getSectorData() {
  const response = await apiFetch<SectorSnapshotResponse>("/api/market/sectors", { schema: sectorSnapshotResponseSchema })
  return {
    sectors: response.sectors.map((sector) => ({
      name: sector.name,
      key: sector.key,
      change: sector.change_percent,
      changePercent: sector.change_percent,
      marketCap: sector.market_cap_label,
      volume: null,
      advances: sector.leaders,
      declines: sector.laggards,
    })),
    last_updated: response.last_updated,
  }
}

export async function getMarketImpact(eventId: string) {
  return analyzeEvent(eventId)
}

export async function getDominoImpact(eventId: string) {
  return analyzeEvent(eventId)
}

export async function getConfidenceScores() {
  return analyzeEvent("market analysis")
}

export async function getPredictions() {
  return analyzeEvent("market prediction")
}

export async function healthCheck() {
  return apiFetch<{ status: string }>("/api/health")
}

export async function getConfig() {
  return apiFetch<ConfigResponse>("/api/config", { schema: configSchema })
}

export async function getDashboardOverview() {
  return apiFetch<DashboardOverview>("/api/dashboard/overview", { schema: dashboardOverviewSchema })
}

export async function getSystemStatus() {
  return apiFetch<SystemStatus>("/api/system/status", { schema: systemStatusSchema })
}

export async function getPredictionsOverview() {
  return apiFetch<PredictionOverview>("/api/predictions/overview", { schema: predictionOverviewSchema })
}

export type { HistoricalEventSummary }

