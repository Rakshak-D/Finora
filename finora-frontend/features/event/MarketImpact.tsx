"use client"

import Panel from "../../components/Panel"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export default function MarketImpact() {

  const impacts = [
    { asset: "Gold", effect: "Positive", arrow: "↑", color: "text-green-400" },
    { asset: "Crypto", effect: "Neutral", arrow: "→", color: "text-yellow-400" },
    { asset: "Tech Stocks", effect: "Negative", arrow: "↓", color: "text-red-400" },
    { asset: "Banking", effect: "Negative", arrow: "↓", color: "text-red-400" }
  ]

  return (

    <Panel title="Predicted Market Reaction">

      <div className="space-y-2">

        {impacts.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="text-sm text-gray-300">{item.asset}</span>
            <span className={`flex items-center gap-1 text-sm font-medium ${item.color}`}>
              {item.effect === "Positive" ? (
                <TrendingUp className="w-3 h-3" />
              ) : item.effect === "Negative" ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              {item.arrow} {item.effect}
            </span>
          </motion.div>
        ))}

      </div>

    </Panel>

  )

}
