"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, LineChart, Radio, TrendingUp, Wallet } from "lucide-react"

const items = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/explorer", label: "Explore", icon: LineChart },
  { href: "/event", label: "Events", icon: Radio },
  { href: "/predictions", label: "Forecasts", icon: TrendingUp },
  { href: "/portfolio", label: "Coach", icon: Wallet },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#120F21]/95 px-3 py-2 backdrop-blur xl:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] transition ${
                active ? "bg-[#A594F9]/14 text-[#F8F9FF]" : "text-slate-400"
              }`}
            >
              <item.icon className={`h-4 w-4 ${active ? "text-[#A594F9]" : ""}`} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
