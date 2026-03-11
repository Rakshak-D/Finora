"use client"

import { useState } from "react"
import Sidebar from "../../layout/Sidebar"
import MarketChart from "../../features/market/MarketChart"

export default function Explorer(){

 const [asset,setAsset] = useState("Gold")
 const [timeframe,setTimeframe] = useState("1D")

 return(

  <div style={{display:"flex"}}>

   <Sidebar/>

   <div
    style={{
     background:"#0B0F19",
     color:"white",
     minHeight:"100vh",
     padding:"30px",
     width:"100%"
    }}
   >

    <h1 className="text-2xl font-semibold">
      Market Explorer
    </h1>


    {/* Controls */}

    <div className="flex gap-4 mt-6">

     <select
      value={asset}
      onChange={(e)=>setAsset(e.target.value)}
      className="bg-[#141A2A] p-2 rounded"
     >

      <option>Gold</option>
      <option>Bitcoin</option>
      <option>Oil</option>
      <option>Nifty</option>

     </select>


     <select
      value={timeframe}
      onChange={(e)=>setTimeframe(e.target.value)}
      className="bg-[#141A2A] p-2 rounded"
     >

      <option>1D</option>
      <option>1W</option>
      <option>1M</option>
      <option>1Y</option>

     </select>

    </div>


    {/* Chart */}

    <div className="mt-8">

      <p style={{marginBottom:"10px"}}>
        Asset: {asset} | Timeframe: {timeframe}
      </p>

      <MarketChart/>

    </div>


   </div>

  </div>

 )

}