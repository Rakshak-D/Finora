"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"
import { useEffect, useState } from "react"
import { getMarketData } from "../services/api"

interface MarketData {
  indices: Array<{
    symbol: string
    name: string
    price: number | null | undefined
    change: number | null | undefined
    changePercent: number | null | undefined
    volume: number | null | undefined
    high: number | null | undefined
    low: number | null | undefined
  }>
  last_updated: string
}

export default function MarketWatch() {
  const [markets, setMarkets] = useState<MarketData['indices']>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function fetchMarketData() {
      try {
        const data = await getMarketData()

        if (!mounted) return

        setMarkets(data.indices.filter((item) => item.price != null))
      } catch {
        if (!mounted) return
        setMarkets([])
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchMarketData()

    // Refresh every 60 seconds
    const interval = setInterval(fetchMarketData, 60000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  function formatPrice(price: number): string {
    if (price >= 1000) {
      return price.toLocaleString('en-IN', { maximumFractionDigits: 0 })
    }
    return price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function formatChange(change: number, isPositive: boolean): string {
    const sign = isPositive ? '+' : ''
    return `${sign}${change.toFixed(2)}%`
  }

  const displayMarkets = markets

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-panel rounded-xl p-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#A594F9]" />
          <h2 className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-rajdhani), sans-serif' }}>
            Global Markets
          </h2>
        </div>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      </div>

      {/* Markets List */}
      <div className="space-y-1">
        {displayMarkets.map((m, i) => {
          const isPositive = (m.changePercent ?? 0) >= 0
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="group flex items-center gap-2 p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            >
              {/* Market Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-medium">{m.name}</p>
                <p className="text-sm font-semibold text-white mono">
                  {m.price != null ? formatPrice(m.price) : "Unavailable"}
                </p>
              </div>

              {/* Change */}
              <div
                className={`flex items-center gap-0.5 text-xs font-bold min-w-[55px] justify-end ${isPositive ? 'text-green-400' : 'text-red-400'
                  }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-2.5 h-2.5" />
                ) : (
                  <TrendingDown className="w-2.5 h-2.5" />
                )}
                <span className="mono text-[10px]">{formatChange(m.changePercent ?? 0, isPositive)}</span>
              </div>
            </motion.div>
          )
        })}
        {!displayMarkets.length && !loading ? (
          <div className="rounded-lg border border-dashed border-white/10 p-3 text-xs text-slate-400">
            Live market cards will appear here once the quote provider responds.
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}

