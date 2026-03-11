"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"
import { Sparklines, SparklinesLine } from "react-sparklines"

interface Market {
  name: string
  price: string
  change: string
  up: boolean
  data: number[]
}

export default function MarketWatch(){

  const markets: Market[] = [
    {
      name: "NIFTY 50",
      price: "24,215.80",
      change: "+0.78%",
      up: true,
      data: [10, 11, 12, 11, 13, 14, 15, 14, 15, 16]
    },
    {
      name: "SENSEX",
      price: "78,096.45",
      change: "+0.68%",
      up: true,
      data: [9, 10, 11, 10, 12, 13, 12, 13, 14, 13]
    },
    {
      name: "NASDAQ",
      price: "22,695.32",
      change: "+1.38%",
      up: true,
      data: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
    },
    {
      name: "DOW JONES",
      price: "47,740.12",
      change: "+0.50%",
      up: true,
      data: [10, 9, 10, 11, 10, 11, 12, 11, 12, 13]
    },
    {
      name: "FTSE 100",
      price: "10,249.67",
      change: "-0.34%",
      up: false,
      data: [14, 13, 12, 11, 10, 9, 8, 9, 8, 7]
    },
    {
      name: "NIKKEI 225",
      price: "54,248.91",
      change: "+2.88%",
      up: true,
      data: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
    },
    {
      name: "BITCOIN",
      price: "92,415.00",
      change: "+2.10%",
      up: true,
      data: [20, 22, 21, 23, 24, 25, 26, 28, 27, 29]
    },
    {
      name: "GOLD",
      price: "2,156.40",
      change: "+0.90%",
      up: true,
      data: [15, 16, 15, 16, 17, 16, 17, 18, 17, 18]
    }
  ]

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
        {markets.map((m, i) => (
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

