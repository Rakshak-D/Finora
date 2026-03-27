"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createChart, ColorType, AreaSeries, type UTCTimestamp } from "lightweight-charts"
import { motion } from "framer-motion"
import { RefreshCw } from "lucide-react"

import Panel from "../../components/Panel"
import { getMarketCandles, getMarketSnapshot } from "../../services/api"

type MarketChartProps = {
  asset?: string
  timeframe?: string
}

type SnapshotInstrument = Awaited<ReturnType<typeof getMarketSnapshot>>["instruments"][number]

const assetMap: Record<string, string> = {
  Nifty: "Nifty_50",
  Gold: "Gold_INR",
  Bitcoin: "Crypto",
  Oil: "Crude_Oil",
}

const intervalMap: Record<string, string> = {
  "1D": "1m",
  "1W": "5m",
  "1M": "1d",
  "1Y": "1w",
}

function formatPrice(value?: number | null) {
  if (value == null) return "Unavailable"
  return value.toLocaleString("en-IN", { maximumFractionDigits: 2 })
}

export default function MarketChart({ asset = "Nifty", timeframe = "1D" }: MarketChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [instrument, setInstrument] = useState<SnapshotInstrument | null>(null)
  const [seriesData, setSeriesData] = useState<{ time: UTCTimestamp; value: number }[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  const marketKey = assetMap[asset] || asset || "Nifty_50"
  const interval = intervalMap[timeframe] || "1d"

  useEffect(() => {
    let cancelled = false

    async function loadChart() {
      setLoading(true)
      try {
        const [snapshot, candles] = await Promise.all([
          getMarketSnapshot([marketKey]),
          getMarketCandles(marketKey, interval),
        ])

        if (cancelled) return

        setInstrument(snapshot.instruments[0] ?? null)
        const normalizedSeries = candles.candles
          .map((candle) => {
            const timestamp = Math.floor(new Date(candle.time).getTime() / 1000)
            return Number.isFinite(timestamp)
              ? { time: timestamp as UTCTimestamp, value: candle.close }
              : null
          })
          .filter((item): item is { time: UTCTimestamp; value: number } => item !== null)
          .sort((left, right) => left.time - right.time)
          .filter((item, index, items) => index === 0 || item.time !== items[index - 1].time)

        setSeriesData(normalizedSeries)
      } catch {
        if (!cancelled) {
          setInstrument(null)
          setSeriesData([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadChart()
    return () => {
      cancelled = true
    }
  }, [interval, marketKey, refreshKey])

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#cfc7eb",
      },
      grid: {
        vertLines: { color: "rgba(165, 148, 249, 0.08)" },
        horzLines: { color: "rgba(165, 148, 249, 0.08)" },
      },
      width: containerRef.current.clientWidth,
      height: 320,
      crosshair: {
        vertLine: { color: "rgba(165, 148, 249, 0.35)" },
        horzLine: { color: "rgba(165, 148, 249, 0.35)" },
      },
      rightPriceScale: {
        borderColor: "rgba(165, 148, 249, 0.2)",
      },
      timeScale: {
        borderColor: "rgba(165, 148, 249, 0.2)",
      },
    })

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: "#A594F9",
      topColor: "rgba(165, 148, 249, 0.35)",
      bottomColor: "rgba(75, 63, 114, 0.05)",
      lineWidth: 2,
    })

    areaSeries.setData(seriesData)

    chart.timeScale().fitContent()
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry?.contentRect.width) {
        chart.applyOptions({ width: entry.contentRect.width })
      }
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
    }
  }, [seriesData])

  const isPositive = (instrument?.change_percent ?? 0) >= 0
  const helperText = useMemo(() => {
    if (!instrument?.display_name) return "Live market chart"
    return `${instrument.display_name} • ${timeframe} • ${instrument.market}`
  }, [instrument?.display_name, instrument?.market, timeframe])

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.1 }}>
      <Panel title="Market Explorer">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{helperText}</p>
            <div className="mt-3 flex flex-wrap items-end gap-6">
              <div>
                <p className="text-xs text-slate-400">Current</p>
                <p className="mono text-2xl font-semibold text-white">{formatPrice(instrument?.price)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Change</p>
                <p className={`mono text-lg font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                  {instrument?.change_percent != null ? `${isPositive ? "+" : ""}${instrument.change_percent.toFixed(2)}%` : "Unavailable"}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setRefreshKey((value) => value + 1)
            }}
            className="rounded-full border border-white/10 p-3 text-slate-300 transition hover:bg-white/6"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <div ref={containerRef} className="w-full" />
          {!seriesData.length && !loading ? (
            <div className="flex h-[320px] items-center justify-center text-sm text-slate-400">
              Live candle data is currently unavailable for this instrument.
            </div>
          ) : null}
        </div>
      </Panel>
    </motion.div>
  )
}
