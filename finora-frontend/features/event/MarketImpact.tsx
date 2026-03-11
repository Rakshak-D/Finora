"use client"

import Panel from "../../components/Panel"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { FinoraAnalysis } from "../../types/finora"

export default function MarketImpact({ analysis }: { analysis: FinoraAnalysis | null }) {

  const changes: Record<string, number> = {}
  const parallels = analysis?.history_echo?.parallels || []
  if (parallels.length > 0) {
    for (const p of parallels) {
      const pc = p?.price_changes || {}
      for (const [k, v] of Object.entries(pc)) {
        if (typeof v === "number") changes[k] = (changes[k] || 0) + v
      }
    }
    for (const k of Object.keys(changes)) changes[k] = changes[k] / parallels.length
  }

  const impacts = Object.entries(changes)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 4)
    .map(([asset, v]) => {
      const effect = v > 0.15 ? "Positive" : v < -0.15 ? "Negative" : "Neutral"
      const arrow = v > 0.15 ? "↑" : v < -0.15 ? "↓" : "→"
      const color = v > 0.15 ? "text-green-400" : v < -0.15 ? "text-red-400" : "text-yellow-400"
      return { asset, effect, arrow, color }
    })

  const fallback = [
    { asset: "Nifty 50", effect: "Neutral", arrow: "→", color: "text-yellow-400" },
    { asset: "Bank Nifty", effect: "Neutral", arrow: "→", color: "text-yellow-400" },
    { asset: "Gold", effect: "Neutral", arrow: "→", color: "text-yellow-400" },
    { asset: "USD INR", effect: "Neutral", arrow: "→", color: "text-yellow-400" }
  ]

  return (

    <Panel title="Predicted Market Reaction">

      <div className="space-y-2">

        {(impacts.length ? impacts : fallback).map((item, i) => (
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
