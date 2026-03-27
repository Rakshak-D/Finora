"use client"

import Panel from "../../components/Panel"
import { motion } from "framer-motion"
import { ArrowDown, Sparkles } from "lucide-react"
import type { FinoraAnalysis } from "../../types/finora"

export default function DominoImpact({ analysis }: { analysis: FinoraAnalysis | null }){

 const raw = analysis?.domino_chain?.chain || []
 const trigger = analysis?.domino_chain?.trigger_sector || analysis?.classification?.primary_sector || "Event"

 const chain = [
  {label:"Event", value:String(trigger).toUpperCase(), color:"#6366f1", icon: "⚡"},
  ...raw.slice(0, 4).map((n: { sector?: string; direction?: string }, idx: number) => {
    const dir = n.direction === "up" ? "▲" : n.direction === "down" ? "▼" : "→"
    const color = n.direction === "up" ? "#22c55e" : n.direction === "down" ? "#ef4444" : "#f59e0b"
    const icon = n.direction === "up" ? "📈" : n.direction === "down" ? "📉" : "🧭"
    return { label: `Impact ${idx + 1}`, value: `${String(n.sector || "").toUpperCase()} ${dir}`, color, icon }
  })
 ]

 return(

 <Panel title="AI Domino Impact">
  <div className="relative">
   {/* Glow effect */}
   <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 blur-xl rounded-xl" />
   
   <div className="relative flex flex-col items-center gap-2">

    {(chain.length > 1 ? chain : [{label:"Event", value:"Run analysis", color:"#6366f1", icon:"⚡"}]).map((item,i)=>(
     <motion.div
      key={i}
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: i * 0.1 }}
      className="flex flex-col items-center w-full"
     >
      <div
       className="w-full px-4 py-3 rounded-lg text-sm flex items-center gap-3 border backdrop-blur-sm"
       style={{
        borderColor: `${item.color}30`,
        background: `${item.color}10`,
        color: item.color
       }}
      >
       <span className="text-lg">{item.icon}</span>
       <div className="flex-1">
        <span className="text-gray-400 text-xs block">
         {item.label}
        </span>
        <span className="font-semibold">
         {item.value}
        </span>
       </div>
       {i === 0 && (
        <Sparkles className="w-4 h-4 animate-pulse" />
       )}
      </div>

      {i !== (chain.length > 1 ? chain.length : 1)-1 && (
       <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 + i * 0.15 }}
        className="arrow-animate text-gray-500 py-1"
       >
        <ArrowDown className="w-4 h-4" />
       </motion.div>
      )}

     </motion.div>
    ))}

   </div>
  </div>
 </Panel>

)

}
