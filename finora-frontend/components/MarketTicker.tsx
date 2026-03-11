"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"

interface MarketItem {
  symbol: string
  price: string
  change: string
  isPositive: boolean
}

export default function MarketTicker(){

  const items: MarketItem[] = [
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

  // Duplicate items for seamless loop
  const displayItems = [...items, ...items, ...items]

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

