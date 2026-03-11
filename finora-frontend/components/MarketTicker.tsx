"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"
import { useEffect, useState } from "react"

interface MarketItem {
  symbol: string
  price: string
  change: string
  isPositive: boolean
}

interface MarketData {
  indices: Array<{
    symbol: string
    name: string
    price: number
    change: number
    changePercent: number
  }>
  last_updated: string
}

export default function MarketTicker() {
  const [items, setItems] = useState<MarketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    async function fetchMarketData() {
      try {
        const response = await fetch('/api/market-data')
        if (!response.ok) {
          throw new Error('Failed to fetch market data')
        }
        
        const data: MarketData = await response.json()
        
        if (!mounted) return

        // Transform API response to ticker items
        const tickerItems: MarketItem[] = data.indices.map((idx) => ({
          symbol: idx.symbol,
          price: formatPrice(idx.price),
          change: `${idx.changePercent >= 0 ? '+' : ''}${idx.changePercent.toFixed(2)}%`,
          isPositive: idx.changePercent >= 0
        }))
        
        setItems(tickerItems)
        setError(null)
      } catch (err) {
        if (!mounted) return
        console.error('Market ticker error:', err)
        setError('Using cached data')
        // Fallback to default items
        setItems(getDefaultItems())
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

  function getDefaultItems(): MarketItem[] {
    return [
      { symbol: "NIFTY", price: "24,215", change: "+0.78%", isPositive: true },
      { symbol: "SENSEX", price: "78,096", change: "+0.68%", isPositive: true },
      { symbol: "NASDAQ", price: "22,695", change: "+1.38%", isPositive: true },
      { symbol: "DOW", price: "47,740", change: "+0.50%", isPositive: true },
      { symbol: "S&P 500", price: "6,120", change: "+0.82%", isPositive: true },
      { symbol: "BTC", price: "$92,415", change: "+2.1%", isPositive: true },
      { symbol: "ETH", price: "$3,240", change: "+1.8%", isPositive: true },
      { symbol: "GOLD", price: "$2,156", change: "+0.9%", isPositive: true },
      { symbol: "OIL", price: "$78.40", change: "-1.2%", isPositive: false },
      { symbol: "SILVER", price: "$24.80", change: "+0.5%", isPositive: true },
    ]
  }

  // Use default items while loading if no error items available
  const displayItems = items.length > 0 ? items : (loading ? getDefaultItems() : items)
  
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
        {tickerItems.map((item, i) => (
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

