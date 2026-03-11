"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"
import { useEffect, useState } from "react"
import { getMarketData } from "../services/api"

interface Market {
  name: string
  price: string
  change: string
  change_pct: number
  up: boolean
  data: number[]
}

export default function MarketWatch(){

  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    
    const fetchData = async () => {
      try {
        const data = await getMarketData()
        if (mounted && Array.isArray(data)) {
          const mapped: Market[] = data.slice(0, 8).map((item: Record<string, unknown>, idx: number) => ({
            name: String(item.name || ""),
            price: String(item.price || ""),
            change: String(item.change || ""),
            change_pct: Number(item.change_pct) || 0,
            up: Boolean(item.isPositive),
            // Generate mock sparkline data based on change direction
            data: Array.from({ length: 10 }, (_, i) => {
              const base = 10 + idx
              const trend = item.isPositive ? i * 0.5 : -i * 0.3
              return base + trend + (Math.random() * 2 - 1)
            })
          }))
          setMarkets(mapped)
        }
      } catch (error) {
        console.error("Failed to fetch market data:", error)
        // Fallback to default data on error
        if (mounted) {
          setMarkets([
            { name: "NIFTY 50", price: "24,215.80", change: "+189.45", change_pct: 0.78, up: true, data: [10, 11, 12, 11, 13, 14, 15, 14, 15, 16] },
            { name: "SENSEX", price: "78,096.45", change: "+530.87", change_pct: 0.68, up: true, data: [9, 10, 11, 10, 12, 13, 12, 13, 14, 13] },
            { name: "NASDAQ", price: "22,695.32", change: "+312.99", change_pct: 1.38, up: true, data: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17] },
            { name: "DOW JONES", price: "47,740.12", change: "+238.70", change_pct: 0.50, up: true, data: [10, 9, 10, 11, 10, 11, 12, 11, 12, 13] },
            { name: "FTSE 100", price: "10,249.67", change: "-34.85", change_pct: -0.34, up: false, data: [14, 13, 12, 11, 10, 9, 8, 9, 8, 7] },
            { name: "NIKKEI 225", price: "54,248.91", change: "+1,563.37", change_pct: 2.88, up: true, data: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16] },
            { name: "BITCOIN", price: "92,415.00", change: "+1,940.72", change_pct: 2.10, up: true, data: [20, 22, 21, 23, 24, 25, 26, 28, 27, 29] },
            { name: "GOLD", price: "2,156.40", change: "+19.41", change_pct: 0.90, up: true, data: [15, 16, 15, 16, 17, 16, 17, 18, 17, 18] }
          ])
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchData()
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000)
    
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  // Fallback data while loading
  const fallbackMarkets: Market[] = [
    { name: "NIFTY 50", price: "24,215.80", change: "+189.45", change_pct: 0.78, up: true, data: [10, 11, 12, 11, 13, 14, 15, 14, 15, 16] },
    { name: "SENSEX", price: "78,096.45", change: "+530.87", change_pct: 0.68, up: true, data: [9, 10, 11, 10, 12, 13, 12, 13, 14, 13] },
    { name: "NASDAQ", price: "22,695.32", change: "+312.99", change_pct: 1.38, up: true, data: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17] },
    { name: "DOW JONES", price: "47,740.12", change: "+238.70", change_pct: 0.50, up: true, data: [10, 9, 10, 11, 10, 11, 12, 11, 12, 13] },
    { name: "FTSE 100", price: "10,249.67", change: "-34.85", change_pct: -0.34, up: false, data: [14, 13, 12, 11, 10, 9, 8, 9, 8, 7] },
    { name: "NIKKEI 225", price: "54,248.91", change: "+1,563.37", change_pct: 2.88, up: true, data: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16] },
    { name: "BITCOIN", price: "92,415.00", change: "+1,940.72", change_pct: 2.10, up: true, data: [20, 22, 21, 23, 24, 25, 26, 28, 27, 29] },
    { name: "GOLD", price: "2,156.40", change: "+19.41", change_pct: 0.90, up: true, data: [15, 16, 15, 16, 17, 16, 17, 18, 17, 18] }
  ]

  const displayMarkets = loading || markets.length === 0 ? fallbackMarkets : markets

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
        {displayMarkets.map((m, i) => (
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
                {m.price}
              </p>
            </div>

            {/* Sparkline - Removed as per user request */}
            
            {/* Change */}
            <div 
              className={`flex items-center gap-0.5 text-xs font-bold min-w-[55px] justify-end ${
                m.up ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {m.up ? (
                <TrendingUp className="w-2.5 h-2.5" />
              ) : (
                <TrendingDown className="w-2.5 h-2.5" />
              )}
              <span className="mono text-[10px]">{m.change}</span>
            </div>
          </motion.div>
        ))}
      </div>

    </motion.div>

  )

}

