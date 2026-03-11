"use client"

import Panel from "../../components/Panel"
import { motion } from "framer-motion"

export default function SectorHeatmap(){

 const sectors = [
  {name:"Technology", change:2.4, marketCap:"12.4T"},
  {name:"Banking", change:-1.2, marketCap:"8.2T"},
  {name:"Energy", change:1.1, marketCap:"4.8T"},
  {name:"Auto", change:-0.6, marketCap:"3.1T"},
  {name:"FMCG", change:0.8, marketCap:"5.6T"},
  {name:"Pharma", change:1.7, marketCap:"2.9T"},
  {name:"Metal", change:-0.9, marketCap:"1.8T"},
  {name:"IT", change:2.1, marketCap:"9.4T"},
  {name:"Real Estate", change:0.4, marketCap:"1.2T"},
  {name:"Telecom", change:-0.3, marketCap:"2.1T"}
 ]

 function getColor(change:number){
  if(change >= 2) return "rgba(34, 197, 94, 0.9)"
  if(change >= 1) return "rgba(74, 222, 128, 0.8)"
  if(change >= 0) return "rgba(134, 239, 172, 0.7)"
  if(change >= -1) return "rgba(248, 113, 113, 0.7)"
  return "rgba(239, 68, 68, 0.9)"
 }

 function getBorderColor(change:number){
  if(change >= 2) return "rgba(34, 197, 94, 0.5)"
  if(change >= 1) return "rgba(74, 222, 128, 0.4)"
  if(change >= 0) return "rgba(134, 239, 172, 0.3)"
  if(change >= -1) return "rgba(248, 113, 113, 0.3)"
  return "rgba(239, 68, 68, 0.5)"
 }

 return(

  <Panel title="Sector Heatmap">

   <div className="grid grid-cols-2 gap-2">

    {sectors.map((s,i)=>(

     <motion.div
      key={i}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.05 }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      className="heatbox relative overflow-hidden"
      style={{
       background: getColor(s.change),
       padding:"12px 8px",
       borderRadius:"8px",
       textAlign:"center",
       border: `1px solid ${getBorderColor(s.change)}`,
       boxShadow: `0 4px 20px ${getColor(s.change)}40`
      }}
     >
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      
      <p className="text-sm font-bold text-white drop-shadow-md">
       {s.name}
      </p>

      <p className="text-lg font-bold mt-1 text-white drop-shadow-md mono">
       {s.change>0 ? "+" : ""}
       {s.change}%
      </p>
      
      <p className="text-[10px] text-white/70 mt-1">
       {s.marketCap}
      </p>

     </motion.div>

    ))}

   </div>

  </Panel>

 )

}
