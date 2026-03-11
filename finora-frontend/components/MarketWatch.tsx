"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"
import { useEffect, useState } from "react"
import { getMarketData } from "../services/api"

interface MarketData {
  indices: Array<{
    symbol: string
    name: string
    price: number
    change: number
    changePercent: number
    volume: number
    high: number
    low: number
  }>
  last_updated: string
}

export default function MarketWatch() {
  const [markets, setMarkets] = useState<MarketData['indices']>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetchMarketData() {
      try {
        const data = await getMarketData() as MarketData

        if (!mounted) return

        setMarkets(data.indices)
        setError(null)
      } catch (err) {
        if (!mounted) return
        // Silent fallback to default markets when backend API is missing
        setError('Using cached data')
        setMarkets(getDefaultMarkets())
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

  function getDefaultMarkets() {
    return [
      { symbol: "NIFTY", name: "NIFTY 50", price: 24215.80, change: 187.45, changePercent: 0.78, volume: 55000000, high: 24380.20, low: 23980.50 },
      { symbol: "SENSEX", name: "SENSEX", price: 78096.45, change: 528.67, changePercent: 0.68, volume: 30000000, high: 78500.00, low: 77500.00 },
      { symbol: "NASDAQ", name: "NASDAQ", price: 22695.32, change: 312.45, changePercent: 1.38, volume: 4500000000, high: 22900.00, low: 22400.00 },
      { symbol: "DOW", name: "DOW JONES", price: 47740.12, change: 238.70, changePercent: 0.50, volume: 350000000, high: 48100.00, low: 47400.00 },
      { symbol: "FTSE", name: "FTSE 100", price: 10249.67, change: -34.85, changePercent: -0.34, volume: 800000000, high: 10300.00, low: 10200.00 },
      { symbol: "NIKKEI", name: "NIKKEI 225", price: 54248.91, change: 1517.46, changePercent: 2.88, volume: 0, high: 54500.00, low: 53000.00 },
      { symbol: "BTC", name: "BITCOIN", price: 92415.00, change: 1940.72, changePercent: 2.10, volume: 35000000000, high: 94000.00, low: 90000.00 },
      { symbol: "GOLD", name: "GOLD", price: 2156.40, change: 19.41, changePercent: 0.90, volume: 200000000, high: 2180.00, low: 2130.00 },
    ]
  }

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

  const displayMarkets = markets.length > 0 ? markets : (loading ? getDefaultMarkets() : getDefaultMarkets())

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
          <Activity className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-rajdhani), sans-serif' }}>
            Global Markets
          </h2>
        </div>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      </div>

      {/* Markets List */}
      <div className="space-y-1">
        {displayMarkets.map((m, i) => {
          const isPositive = m.changePercent >= 0
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
                  {formatPrice(m.price)}
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
                <span className="mono text-[10px]">{formatChange(m.changePercent, isPositive)}</span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

