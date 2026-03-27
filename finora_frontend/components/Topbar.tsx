"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Search, Activity, BarChart2 } from "lucide-react"
import { useEffect, useState } from "react"

import { getDashboardOverview } from "../services/api"

export default function Topbar(){
  const router = useRouter()
  const [marketsTracked, setMarketsTracked] = useState<number | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    let mounted = true
    getDashboardOverview()
      .then((overview) => {
        if (mounted) setMarketsTracked(overview.markets_tracked)
      })
      .catch(() => {
        if (mounted) setMarketsTracked(null)
      })

    return () => {
      mounted = false
    }
  }, [])

  function submitSearch() {
    if (!query.trim()) return
    router.push(`/event?q=${encodeURIComponent(query.trim())}`)
  }

  return(

    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-between glass-panel border-x-0 border-t-0 px-6 py-4"
    >

      {/* Logo & Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#A594F9] via-[#8E7CE6] to-[#4B3F72] shadow-lg shadow-[#A594F9]/20">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 
              className="bg-gradient-to-r from-[#F8F9FF] via-[#D9D3FF] to-[#A594F9] bg-clip-text text-xl font-black uppercase tracking-[0.15em] text-transparent"
              style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
            >
              Finora
            </h1>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[#b8acd8]">Financial Coach</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-xl mx-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b8acd8]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                submitSearch()
              }
            }}
            aria-label="Search markets or events"
            placeholder="Search markets, events, companies, or ask AI..."
            className="w-full rounded-xl input-glass pl-12 pr-4 py-3 text-sm text-white placeholder:text-[#9c90c2]"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <kbd className="hidden rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-[#b8acd8] sm:inline-flex items-center gap-1">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      <button
        onClick={submitSearch}
        className="hidden rounded-xl border border-[#A594F9]/20 bg-[#A594F9]/12 px-4 py-2 text-xs font-semibold text-[#F8F9FF] transition hover:bg-[#A594F9]/18 xl:inline-flex"
      >
        Open Event View
      </button>

      {/* Status & Actions */}
      <div className="flex items-center gap-6">
        {/* Live Indicator */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75" />
          </div>
          <span className="text-sm font-medium text-[#d9d3ff]">Live</span>
        </div>

        {/* Stats */}
        <div className="hidden items-center gap-4 text-xs text-[#b8acd8] lg:flex">
          <div className="flex items-center gap-1">
            <Activity className="h-3 w-3 text-[#A594F9]" />
            <span>{marketsTracked != null ? `${marketsTracked} Markets` : "Live markets"}</span>
          </div>
        </div>

        {/* User Avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#A594F9] to-[#4B3F72] text-sm font-semibold text-[#0F0C1D]">
          F
        </div>
      </div>

    </motion.div>

  )

}

