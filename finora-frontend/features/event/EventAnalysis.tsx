"use client"

import { useState } from "react"
import Panel from "../../components/Panel"
import { motion } from "framer-motion"
import { analyzeEvent } from "../../services/api"
import { Search, Zap } from "lucide-react"
import type { FinoraAnalysis } from "../../types/finora"

type Props = {
  setRegion?: (v: string) => void
  onResult?: (analysis: FinoraAnalysis) => void
}

type MappedBars = {
  raw: FinoraAnalysis
  labels: string[]
  scores: number[]
}

export default function EventAnalysis({ setRegion, onResult }: Props) {

  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MappedBars | null>(null)

 const analyze = async () => {
  if (!text.trim()) return

  setLoading(true)

  try {

    const data = await analyzeEvent(text)

    // Keep UI unchanged: this component renders label bars. Map backend sector scores → {labels, scores}.
    const sectorScores = data?.classification?.all_sector_scores || {}
    const entries = Object.entries(sectorScores)
      .filter(([, v]) => typeof v === "number")
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 8)

    const mapped = {
      raw: data,
      labels: entries.map(([k]) => String(k).toUpperCase()),
      scores: entries.map(([, v]) => Number(v)),
    }

    setResult(mapped)
    if (onResult) onResult(mapped.raw)

  } catch (error) {

    console.error("Error calling backend:", error)

  } finally {
    setLoading(false)
  }
}
  return (

    <Panel title="Event Analysis">

      <div className="mt-2">

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={text}
              onChange={(e)=>setText(e.target.value)}
              placeholder="Enter news headline..."
              className="input-glass w-full pl-10 pr-4 py-2 rounded-lg text-sm"
            />
          </div>
          <button
            onClick={analyze}
            disabled={loading}
            className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
          >
            <Zap className="w-4 h-4" />
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {result && (

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 space-y-3"
          >

            {result.labels && result.labels.map((label: string, i: number) => {

              const width = (result.scores?.[i] ?? 0.0) * 100

              return(

                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300">{label}</span>
                    <span className="text-gray-400 mono">{Math.round(width)}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    />
                  </div>
                </motion.div>

              )

            })}

          </motion.div>

        )}

      </div>

    </Panel>

  )

}
