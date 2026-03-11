"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"
import { useEffect, useState } from "react"
import { getMarketData } from "../services/api"

interface MarketItem {
  symbol: string
  name: string
  price: string
  change: string
  change_pct: number
  isPositive: boolean
}

export default function MarketTicker(){

  const [items, setItems] = useState<MarketItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    
    const fetchData = async () => {
      try {
        const data = await getMarketData()
        if (mounted && Array.isArray(data)) {
          const mapped: MarketItem[] = data.map((item: Record<string, unknown>) => ({
            symbol: String(item.symbol || ""),
            name: String(item.name || ""),
            price: String(item.price || ""),
            change: String(item.change || ""),
            change_pct: Number(item.change_pct) || 0,
            isPositive: Boolean(item.isPositive)
          }))
          setItems(mapped)
        }
      } catch (error) {
        console.error("Failed to fetch market data:", error)
        // Fallback to default data on error
        if (mounted) {
          setItems([
            { symbol: "NIFTY", name: "Nifty 50", price: "24,215", change: "+189.45", change_pct: 0.78, isPositive: true },
            { symbol: "SENSEX", name: "Sensex", price: "78,096", change: "+530.87", change_pct: 0.68, isPositive: true },
            { symbol: "NASDAQ", name: "NASDAQ", price: "22,695", change: "+312.99", change_pct: 1.38, isPositive: true },
            { symbol: "DOW", name: "Dow Jones", price: "47,740", change: "+238.70", change_pct: 0.50, isPositive: true },
            { symbol: "SP500", name: "S&P 500", price: "6,120", change: "+50.23", change_pct: 0.82, isPositive: true },
            { symbol: "BTC", name: "Bitcoin", price: "92,415", change: "+1,940.72", change_pct: 2.10, isPositive: true },
            { symbol: "ETH", name: "Ethereum", price: "3,240", change: "+58.33", change_pct: 1.80, isPositive: true },
            { symbol: "GOLD", name: "Gold", price: "2,156", change: "+19.41", change_pct: 0.90, isPositive: true },
            { symbol: "OIL", name: "Crude Oil", price: "78.40", change: "-0.94", change_pct: -1.20, isPositive: false },
            { symbol: "SILVER", name: "Silver", price: "24.80", change: "+0.12", change_pct: 0.50, isPositive: true },
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
  const fallbackItems: MarketItem[] = [
    { symbol: "NIFTY", name: "Nifty 50", price: "24,215", change: "+189.45", change_pct: 0.78, isPositive: true },
    { symbol: "SENSEX", name: "Sensex", price: "78,096", change: "+530.87", change_pct: 0.68, isPositive: true },
    { symbol: "NASDAQ", name: "NASDAQ", price: "22,695", change: "+312.99", change_pct: 1.38, isPositive: true },
    { symbol: "DOW", name: "Dow Jones", price: "47,740", change: "+238.70", change_pct: 0.50, isPositive: true },
    { symbol: "SP500", name: "S&P 500", price: "6,120", change: "+50.23", change_pct: 0.82, isPositive: true },
    { symbol: "BTC", name: "Bitcoin", price: "92,415", change: "+1,940.72", change_pct: 2.10, isPositive: true },
    { symbol: "ETH", name: "Ethereum", price: "3,240", change: "+58.33", change_pct: 1.80, isPositive: true },
    { symbol: "GOLD", name: "Gold", price: "2,156", change: "+19.41", change_pct: 0.90, isPositive: true },
    { symbol: "OIL", name: "Crude Oil", price: "78.40", change: "-0.94", change_pct: -1.20, isPositive: false },
    { symbol: "SILVER", name: "Silver", price: "24.80", change: "+0.12", change_pct: 0.50, isPositive: true },
  ]

  const displayItems = loading ? fallbackItems : items.length > 0 ? [...items, ...items, ...items] : [...fallbackItems, ...fallbackItems, ...fallbackItems]

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
        {displayItems.map((item, i) => (
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
              className={`flex items-center gap-1 text-xs font-medium ${
                item.isPositive ? 'text-green-400' : 'text-red-400'
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
        ))}
      </motion.div>
    </div>

  )

}

