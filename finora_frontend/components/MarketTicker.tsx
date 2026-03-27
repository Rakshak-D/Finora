"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"
import { useEffect, useState } from "react"
import { getMarketSnapshot } from "../services/api"

interface MarketItem {
  symbol: string
  price: string
  change: string
  isPositive: boolean
}

export default function MarketTicker() {
  const [items, setItems] = useState<MarketItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function fetchMarketData() {
      try {
        const data = await getMarketSnapshot()

        if (!mounted) return

        const tickerItems: MarketItem[] = data.instruments
          .filter((instrument) => instrument.price != null && instrument.change_percent != null)
          .map((instrument) => ({
            symbol: instrument.display_name,
            price: formatPrice(instrument.price ?? null),
            change: `${(instrument.change_percent ?? 0) >= 0 ? "+" : ""}${(instrument.change_percent ?? 0).toFixed(2)}%`,
            isPositive: (instrument.change_percent ?? 0) >= 0,
          }))

        setItems(tickerItems)
      } catch {
        if (!mounted) return
        setItems([])
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

  function formatPrice(price: number | null): string {
    if (price == null) return "Unavailable"
    if (price >= 1000) {
      return price.toLocaleString('en-IN', { maximumFractionDigits: 0 })
    }
    return price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const displayItems = items

  // Duplicate items for seamless loop
  const tickerItems = [...displayItems, ...displayItems, ...displayItems]

  return (
    <div className="relative overflow-hidden border-y border-white/5 bg-black/20">
      {/* Gradient masks for edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#020617] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#020617] to-transparent z-10" />

      <motion.div
        className="flex items-center gap-8 py-3 whitespace-nowrap ticker-animation"
        style={{
          width: 'fit-content'
        }}
      >
        {tickerItems.length ? tickerItems.map((item, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-3 px-4 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-default"
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-sm font-semibold text-white">
              {item.symbol}
            </span>
            <span className="text-sm text-gray-400 mono">
              {item.price}
            </span>
            <span
              className={`flex items-center gap-1 text-xs font-medium ${item.isPositive ? 'text-green-400' : 'text-red-400'
                }`}
            >
              {item.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {item.change}
            </span>
            {/* Divider */}
            <div className="w-px h-4 bg-white/10 mx-2" />
          </motion.div>
        )) : !loading ? (
          <div className="px-4 text-sm text-slate-400">Live market tape is unavailable right now.</div>
        ) : null}
      </motion.div>
    </div>
  )
}

