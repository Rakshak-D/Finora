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

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement)

export default function GlobalIndices(){

 const indices = [
  {
   name:"NIFTY",
   value:"24,215",
   change:"+0.78",
   data:[24000,24100,24200,24180,24250,24210]
  },
  {
   name:"SENSEX",
   value:"78,096",
   change:"+0.68",
   data:[77500,77650,77720,77800,77900,78096]
  },
  {
   name:"NASDAQ",
   value:"22,695",
   change:"+1.38",
   data:[22400,22500,22580,22620,22680,22695]
  },
  {
   name:"S&P 500",
   value:"6,795",
   change:"+0.83",
   data:[6700,6720,6750,6780,6790,6795]
  }
 ]

 return(

  <Panel title="Global Indices">

   <div className="space-y-0.5">

    {indices.map((item,i)=>{

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
