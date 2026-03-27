"use client"

import Panel from "../../components/Panel"
import { motion } from "framer-motion"
import { Brain } from "lucide-react"
import type { FinoraAnalysis } from "../../types/finora"

export default function ConfidenceMeter({ analysis }: { analysis: FinoraAnalysis | null }){

 const sectorScores = analysis?.classification?.all_sector_scores || {}
 const entries = Object.entries(sectorScores)
  .filter(([, v]) => typeof v === "number")
  .sort((a, b) => (b[1] as number) - (a[1] as number))
  .slice(0, 4)

 const predictions = entries.map(([name, score]) => {
  const pct = Math.max(0, Math.min(100, Math.round(Number(score) * 100)))
  const dir = name === analysis?.classification?.primary_sector ? "▲" : "→"
  return { name: `${String(name).toUpperCase()} ${dir}`, confidence: pct }
 })

 const fallback = [
  {name:"Run analysis to compute confidence", confidence:60}
 ]

 function getColor(confidence: number){
  if(confidence >= 70) return "bg-green-500"
  if(confidence >= 50) return "bg-yellow-500"
  return "bg-red-500"
 }

 return(

 <Panel title="AI Confidence">
  <div className="flex items-center gap-2 mb-4">
   <Brain className="w-4 h-4 text-purple-400" />
   <span className="text-xs text-gray-400">ML Predictions</span>
  </div>

  <div className="space-y-3">

   {(predictions.length ? predictions : fallback).map((p,i)=>(
    <motion.div
     key={i}
     initial={{ opacity: 0, x: -20 }}
     whileInView={{ opacity: 1, x: 0 }}
     viewport={{ once: true }}
     transition={{ delay: i * 0.1 }}
    >

     <div className="flex justify-between text-sm mb-1">

      <span className="text-gray-300">{p.name}</span>

      <span className="text-gray-400 mono">
       {p.confidence}%
      </span>

     </div>

     <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">

      <motion.div
       initial={{ width: 0 }}
       whileInView={{ width: `${p.confidence}%` }}
       viewport={{ once: true }}
       transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
       className={`h-2 rounded-full ${getColor(p.confidence)} shadow-lg`}
      />

     </div>

    </motion.div>
   ))}

  </div>

 </Panel>

 )

}
