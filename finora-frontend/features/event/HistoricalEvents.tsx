"use client"

import Panel from "../../components/Panel"
import { motion } from "framer-motion"
import type { FinoraAnalysis } from "../../types/finora"

export default function HistoricalEvents({ analysis }: { analysis: FinoraAnalysis | null }) {

  const parallels = analysis?.history_echo?.parallels || []
  const events = parallels.slice(0, 5).map((p) => ({
    title: `${p.event_date || "Unknown"} • ${String(p.sector || "").toUpperCase()}`,
    impact: p.event_summary || "—"
  }))

  const fallback = [
    { title: "No analysis yet", impact: "Run an event analysis to fetch similar historical events." }
  ]

  return (

    <Panel title="Similar Historical Events">

      <div>

        {(events.length ? events : fallback).map((event: { title: string; impact: string }, i: number) => (

          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            style={{
              background:"#141A2A",
              padding:"12px",
              borderRadius:"8px",
              marginTop:"8px"
            }}
          >

            <h4 className="text-sm text-white">{event.title}</h4>

            <p className="text-xs text-gray-400 mt-1">
              {event.impact}
            </p>

          </motion.div>

        ))}

      </div>

    </Panel>

  )

}
