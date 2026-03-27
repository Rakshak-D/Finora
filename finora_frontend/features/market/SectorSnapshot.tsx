"use client"

import Panel from "../../components/Panel"

export default function SectorSnapshot(){

  const sectors = [
    {name:"Banking", change:1.2},
    {name:"IT", change:0.6},
    {name:"FMCG", change:-0.3},
    {name:"Auto", change:0.8},
    {name:"Metal", change:1.5}
  ]

  return(

    <Panel title="Sector Snapshot">

      {sectors.map((s,i)=>{

        const positive = s.change > 0

        return(

          <div
            key={i}
            className="flex justify-between mt-2"
          >

            <span>{s.name}</span>

            <span style={{color:positive?"lime":"red"}}>
              {positive ? "↑":"↓"} {s.change}%
            </span>

          </div>

        )

      })}

    </Panel>

  )

}