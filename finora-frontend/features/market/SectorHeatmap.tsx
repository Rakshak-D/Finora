"use client"

import Panel from "../../components/Panel"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { getSectorData } from "../../services/api"

interface SectorItem {
  name: string
  change: number
  market_cap: string
}

export default function SectorHeatmap(){

 const [sectors, setSectors] = useState<SectorItem[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
   let mounted = true
   
   const fetchData = async () => {
     try {
       const data = await getSectorData()
       if (mounted && Array.isArray(data)) {
         const mapped: SectorItem[] = data.map((item: Record<string, unknown>) => ({
           name: String(item.name || ""),
           change: Number(item.change) || 0,
           market_cap: String(item.market_cap || "")
         }))
         setSectors(mapped)
       }
     } catch (error) {
       console.error("Failed to fetch sector data:", error)
       if (mounted) {
         setSectors([
           { name: "Technology", change: 2.4, market_cap: "12.4T" },
           { name: "Banking", change: -1.2, market_cap: "8.2T" },
           { name: "Energy", change: 1.1, market_cap: "4.8T" },
           { name: "Auto", change: -0.6, market_cap: "3.1T" },
           { name: "FMCG", change: 0.8, market_cap: "5.6T" },
           { name: "Pharma", change: 1.7, market_cap: "2.9T" },
           { name: "Metal", change: -0.9, market_cap: "1.8T" },
           { name: "IT", change: 2.1, market_cap: "9.4T" },
           { name: "Real Estate", change: 0.4, market_cap: "1.2T" },
           { name: "Telecom", change: -0.3, market_cap: "2.1T" }
         ])
       }
     } finally {
       if (mounted) setLoading(false)
     }
   }

   fetchData()

   // Refresh every 60 seconds
   const interval = setInterval(fetchData, 60000)
   
   return () => {
     mounted = false
     clearInterval(interval)
   }
 }, [])

 // Fallback data while loading
 const fallbackSectors: SectorItem[] = [
   { name: "Technology", change: 2.4, market_cap: "12.4T" },
   { name: "Banking", change: -1.2, market_cap: "8.2T" },
   { name: "Energy", change: 1.1, market_cap: "4.8T" },
   { name: "Auto", change: -0.6, market_cap: "3.1T" },
   { name: "FMCG", change: 0.8, market_cap: "5.6T" },
   { name: "Pharma", change: 1.7, market_cap: "2.9T" },
   { name: "Metal", change: -0.9, market_cap: "1.8T" },
   { name: "IT", change: 2.1, market_cap: "9.4T" },
   { name: "Real Estate", change: 0.4, market_cap: "1.2T" },
   { name: "Telecom", change: -0.3, market_cap: "2.1T" }
 ]

 const displaySectors = loading || sectors.length === 0 ? fallbackSectors : sectors

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

    {displaySectors.map((s,i)=>(

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
       {s.market_cap}
      </p>

     </motion.div>

    ))}

   </div>

  </Panel>

 )

}
