"use client"

import Panel from "../../components/Panel"
import { motion } from "framer-motion"
import { Brain } from "lucide-react"

export default function ConfidenceMeter(){

 const predictions = [
  {name:"Energy Sector ▲", confidence:82},
  {name:"Banking Sector ▼", confidence:56},
  {name:"Tech Sector ▼", confidence:34},
  {name:"Gold ▲", confidence:71}
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

   {predictions.map((p,i)=>(
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
