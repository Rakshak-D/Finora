"use client"

import { TrendingUp, TrendingDown } from "lucide-react"

type Props = {
  title: string
  value: string
  change: number
}

export default function MarketCard({ title, value, change }: Props) {

  return(

    <div className="bg-[#141A2A] border border-[#1F2937] p-3 rounded-lg text-sm">

      <p className="text-xs text-gray-400">{title}</p>
      <h2 className="text-base font-semibold">{value}</h2>

      <div className="flex items-center gap-1">

{change > 0 ? (
  <TrendingUp size={14} className="text-green-400"/>
) : (
  <TrendingDown size={14} className="text-red-400"/>
)}

<p className={change > 0 ? "text-green-400" : "text-red-400"}>
 {change}%
</p>

</div>

    </div>
  )

}