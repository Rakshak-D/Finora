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
       if (mounted && Array.isArray(data)) {
         const mapped: IndexItem[] = data.slice(0, 4).map((item: Record<string, unknown>) => ({
           name: String(item.name || ""),
           value: String(item.price || ""),
           change: String(item.change || ""),
           change_pct: Number(item.change_pct) || 0,
           // Generate mock chart data based on change direction
           data: Array.from({ length: 6 }, (_, i) => {
             const base = parseFloat(String(item.price || "10000").replace(/,/g, "")) || 10000
             const trend = item.isPositive ? (6 - i) * -0.5 : (6 - i) * 0.3
             return base * (1 + (trend / 100))
           })
         }))
         setIndices(mapped)
       }
     } catch (error) {
       console.error("Failed to fetch indices:", error)
       if (mounted) {
         setIndices([
           { name: "NIFTY", value: "24,215", change: "+189.45", change_pct: 0.78, data: [24000,24100,24200,24180,24250,24210] },
           { name: "SENSEX", value: "78,096", change: "+530.87", change_pct: 0.68, data: [77500,77650,77720,77800,77900,78096] },
           { name: "NASDAQ", value: "22,695", change: "+312.99", change_pct: 1.38, data: [22400,22500,22580,22620,22680,22695] },
           { name: "S&P 500", value: "6,120", change: "+50.23", change_pct: 0.82, data: [6700,6720,6750,6780,6790,6120] }
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
 const fallbackIndices: IndexItem[] = [
   { name: "NIFTY", value: "24,215", change: "+189.45", change_pct: 0.78, data: [24000,24100,24200,24180,24250,24210] },
   { name: "SENSEX", value: "78,096", change: "+530.87", change_pct: 0.68, data: [77500,77650,77720,77800,77900,78096] },
   { name: "NASDAQ", value: "22,695", change: "+312.99", change_pct: 1.38, data: [22400,22500,22580,22620,22680,22695] },
   { name: "S&P 500", value: "6,120", change: "+50.23", change_pct: 0.82, data: [6700,6720,6750,6780,6790,6120] }
 ]

 const displayIndices = loading || indices.length === 0 ? fallbackIndices : indices

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
         <div className="text-green-400 text-xs font-bold">
          {item.value}
         </div>
       <div className="text-green-500 text-[9px]">
          +{item.change}%
        </div>
        </div>

<div className="w-20 h-10 flex-shrink-0">
         <Line data={chartData} options={options}/>
        </div>

       </div>

      )

    })}

   </div>

  </Panel>

 )

}
