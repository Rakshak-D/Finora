"use client"

import { motion } from "framer-motion"
import { Search, Activity, BarChart2, Zap } from "lucide-react"

export default function Topbar(){

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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] via-[#06B6D4] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-blue-500/20">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 
              className="text-xl font-black tracking-[0.15em] uppercase bg-gradient-to-r from-white via-blue-200 to-gray-400 bg-clip-text text-transparent"
              style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
            >
              Finora
            </h1>
            <p className="text-[10px] text-gray-500 -mt-0.5 uppercase tracking-wider">Intelligence</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-xl mx-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            placeholder="Search markets, events, companies, or ask AI..."
            className="w-full input-glass rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-gray-500"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 bg-white/5 rounded border border-white/10">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-6">
        {/* Live Indicator */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75" />
          </div>
          <span className="text-sm text-green-400 font-medium">Live</span>
        </div>

        {/* Stats */}
        <div className="hidden lg:flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            <span>42 Markets</span>
          </div>
        </div>

        {/* User Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-sm font-semibold">
          F
        </div>
      </div>

    </motion.div>

  )

}

