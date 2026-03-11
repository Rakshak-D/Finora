"use client"

import Panel from "../../components/Panel"
import { motion } from "framer-motion"
import type { FinoraAnalysis } from "../../types/finora"

export default function EventExplanation({ analysis }: { analysis: FinoraAnalysis | null }){

 const explanations: string[] = []

 const persona = analysis?.persona_summary
 if (typeof persona === "string" && persona.trim()) {
  explanations.push(...persona.split(/[.\n]/).map((s: string) => s.trim()).filter(Boolean).slice(0, 4))
 }

 const echo = analysis?.history_echo?.echo_summary
 if (typeof echo === "string" && echo.trim()) explanations.push(echo.trim())

 const domino = analysis?.domino_chain?.chain || []
 for (const n of domino.slice(0, 3)) {
  if (n?.reason) explanations.push(String(n.reason))
 }

 const fallback = [
  "Run an event analysis to generate an explanation based on sentiment, historical parallels, and domino effects."
 ]

 return(

  <Panel title="Impact Explanation">

    <div className="space-y-2">

      {(explanations.length ? explanations.slice(0, 6) : fallback).map((item,index)=>(

        <motion.p 
          key={index}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="text-xs text-gray-300"
        >
          • {item}
        </motion.p>

      ))}

    </div>

  </Panel>

 )

}
