"use client"

import Panel from "../../components/Panel"
import { Line } from "react-chartjs-2"
import {
 Chart as ChartJS,
 LineElement,
 CategoryScale,
 LinearScale,
 PointElement
} from "chart.js"
import { useEffect, useState } from "react"
import { getMarketData } from "../../services/api"

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement)

interface IndexItem {
  name: string
  value: string
  change: string
  change_pct: number
  data: number[]
}

export default function GlobalIndices(){

 const [indices, setIndices] = useState<IndexItem[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
   let mounted = true
   
   const fetchData = async () => {
     try {
       const data = await getMarketData()
       if (mounted && Array.isArray(data?.indices)) {
         const mapped: IndexItem[] = data.indices.slice(0, 4).map((item: Record<string, unknown>) => ({
           name: String(item.name || ""),
           value: String(item.price ?? "Unavailable"),
           change: String(item.changePercent ?? ""),
           change_pct: Number(item.changePercent) || 0,
           data: Array.isArray(item.sparkline) ? (item.sparkline as number[]) : [],
         }))
         setIndices(mapped)
       }
     } catch (error) {
       void error
       if (mounted) {
         setIndices([])
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
 const displayIndices = indices

 return (

  <Panel title="Global Indices">

   <div className="space-y-0.5">

    {displayIndices.map((item,i)=>{

      const chartData = {
       labels:["1","2","3","4","5","6"],
       datasets:[
        {
         data:item.data,
         borderColor:"#22c55e",
         borderWidth:1,
         tension:0.4,
         pointRadius:0
        }
       ]
      }

      const options={
       plugins:{legend:{display:false}},
       scales:{
        x:{display:false},
        y:{display:false}
       },
       maintainAspectRatio: false
      }

      return(

       <div
        key={i}
        className="flex items-center justify-between gap-1 py-0.5"
       >

        <div className="flex-1 min-w-0">
         <p className="text-[10px] font-semibold text-gray-300">{item.name}</p>
         <div className={item.change_pct >= 0 ? "text-green-400 text-xs font-bold" : "text-red-400 text-xs font-bold"}>
          {item.value}
         </div>
       <div className={item.change_pct >= 0 ? "text-green-500 text-[9px]" : "text-red-500 text-[9px]"}>
          {item.change_pct >= 0 ? "+" : ""}{item.change_pct.toFixed(2)}%
        </div>
        </div>

<div className="w-20 h-10 flex-shrink-0">
         {item.data.length ? <Line data={chartData} options={options}/> : null}
        </div>

       </div>

      )

    })}

   </div>
   {!displayIndices.length && !loading ? (
    <div className="rounded-lg border border-dashed border-white/10 p-3 text-xs text-slate-400">
      Global index mini-charts are waiting for live quote history.
    </div>
   ) : null}

  </Panel>

 )

}
