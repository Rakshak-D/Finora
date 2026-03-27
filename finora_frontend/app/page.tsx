"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

import Topbar from "../components/Topbar"
import Sidebar from "../layout/Sidebar"
import MarketTicker from "../components/MarketTicker"
import MobileNav from "../components/shared/MobileNav"

import SectorHeatmap from "../features/market/SectorHeatmap"

import MarketChart from "../features/market/MarketChart"

import NewsFeed from "../features/news/NewsFeed"

import EventAnalysis from "../features/event/EventAnalysis"
import MarketImpact from "../features/event/MarketImpact"
import HistoricalEvents from "../features/event/HistoricalEvents"
import EventExplanation from "../features/event/EventExplanation"
import DominoImpact from "../features/event/DominoImpact"
import ConfidenceMeter from "../features/event/ConfidenceMeter"
import type { FinoraAnalysis } from "../types/finora"

import { Search, Zap, Brain, TrendingUp, Activity, Globe, BarChart2 } from "lucide-react"
import { getDashboardOverview, getSystemStatus } from "../services/api"

// Stats from API
interface DashboardStats {
  aiSignals: number
  marketsTracked: number
  liveArticles: number
  coachReadiness: number
  beginnerMessage: string
}

export default function Home() {
  const router = useRouter()
  const [analysis, setAnalysis] = useState<FinoraAnalysis | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [pipelineLabel, setPipelineLabel] = useState("Checking")
  const [stats, setStats] = useState<DashboardStats>({
    aiSignals: 0,
    marketsTracked: 0,
    liveArticles: 0,
    coachReadiness: 0,
    beginnerMessage: ""
  })

  // Fetch initial data from API
  useEffect(() => {
    let mounted = true

    async function fetchDashboardData() {
      try {
        const [overview, systemStatus] = await Promise.all([
          getDashboardOverview().catch(() => null),
          getSystemStatus().catch(() => null),
        ])

        if (!mounted) return

        setStats({
          aiSignals: overview?.historical_events ?? 0,
          marketsTracked: overview?.markets_tracked ?? 0,
          liveArticles: overview?.live_articles ?? 0,
          coachReadiness: overview?.coach_readiness ?? 0,
          beginnerMessage: overview?.beginner_message ?? "Finora explains fast-moving market news without requiring finance jargon.",
        })
        setPipelineLabel(systemStatus?.pipeline_ready ? "Primary models ready" : "Fallback mode active")
      } catch (err) {
        void err
        setStats({
          aiSignals: 0,
          marketsTracked: 0,
          liveArticles: 0,
          coachReadiness: 0,
          beginnerMessage: "Finora explains fast-moving market news without requiring finance jargon.",
        })
        setPipelineLabel("Status unavailable")
      }
    }

    fetchDashboardData()

    // Refresh stats every 2 minutes
    const interval = setInterval(fetchDashboardData, 120000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  function handleHeroAnalyze() {
    if (!searchQuery.trim()) return
    router.push(`/event?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  const statsData = [
    { label: "Historical Cases", value: stats.aiSignals.toString(), icon: Brain, color: "text-[#A594F9]" },
    { label: "Markets Tracked", value: stats.marketsTracked.toString(), icon: Globe, color: "text-[#D9D3FF]" },
    { label: "Live Articles", value: stats.liveArticles.toString(), icon: Activity, color: "text-[#c3b6ff]" },
    { label: "Coach Ready", value: `${stats.coachReadiness}%`, icon: TrendingUp, color: "text-green-400" }
  ]

  // Animation variants for scroll reveal
  const revealVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 background-grid opacity-30" />
        <div className="background-glow">
          <div className="glow-orb glow-orb-1" />
          <div className="glow-orb glow-orb-2" />
          <div className="glow-orb glow-orb-3" />
        </div>
      </div>

      {/* LEFT SIDEBAR - Contains Global Markets & Global Indices */}
      <Sidebar />

      {/* MAIN DASHBOARD */}
      <div className="flex-1 relative z-10 overflow-y-auto">
        <Topbar />
        <div className="p-2 pb-24 lg:p-3 xl:pb-3">
          <MarketTicker />

          {/* HERO INTELLIGENCE PANEL */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-lg hero-gradient p-2 lg:p-3 mb-2 lg:mb-3 border border-white/5 relative overflow-hidden"
          >
            {/* Glow effect */}
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-[#A594F9]/15 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-[#4B3F72]/35 blur-3xl" />

            <div className="relative z-10">
              {/* Title Row - FINORA IN CAPS with Orbitron font */}
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-[#A594F9]" />
                <h1
                  className="bg-gradient-to-r from-[#F8F9FF] via-[#D9D3FF] to-[#A594F9] bg-clip-text text-base font-black uppercase tracking-[0.2em] text-transparent lg:text-lg"
                  style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
                >
                  Finora
                </h1>
              </div>
              <p className="mb-3 max-w-3xl text-sm leading-6 text-slate-300">
                {stats.beginnerMessage}
              </p>

              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-1.5 mb-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#b8acd8]" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleHeroAnalyze()
                      }
                    }}
                    placeholder="Search companies, events, macro signals..."
                    className="w-full input-glass rounded-md pl-8 pr-2 py-1.5 text-xs"
                  />
                </div>
                <button onClick={handleHeroAnalyze} className="btn-primary px-3 py-1.5 rounded-md flex items-center justify-center gap-1 text-xs">
                  <Zap className="w-2.5 h-2.5" />
                  Analyze
                </button>
              </div>

              {/* Stats Cards - Very Compact */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-4 gap-1.5"
              >
                {statsData.map((stat) => (
                  <motion.div
                    key={stat.label}
                    variants={itemVariants}
                    className="glass-panel p-1.5 rounded-md"
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <stat.icon className={`w-2.5 h-2.5 ${stat.color}`} />
                      <p className="text-[8px] uppercase tracking-wider text-[#b8acd8]">{stat.label}</p>
                    </div>
                    <p className="text-sm font-bold text-white mono">{stat.value}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* MARKET CHART - Bigger, full width after sidebar ends */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={revealVariants}
            className="mb-6"
          >
            <MarketChart />
          </motion.div>

          {/* MARKET NEWS - Full width with proper spacing */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={revealVariants}
            className="mb-6"
          >
            <NewsFeed />
          </motion.div>

          {/* EVENT ANALYSIS - Full width */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={revealVariants}
            className="mb-6"
          >
            <EventAnalysis onResult={setAnalysis} />
          </motion.div>

          {/* CONFIDENCE METER - Full width */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={revealVariants}
            className="mb-6"
          >
            <ConfidenceMeter analysis={analysis} />
          </motion.div>

          {/* HISTORICAL EVENTS - Full width */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={revealVariants}
            className="mb-6"
          >
            <HistoricalEvents analysis={analysis} />
          </motion.div>

          {/* MARKET IMPACT + EVENT EXPLANATION + DOMINO IMPACT - Grid layout */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={revealVariants}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6"
          >
            <MarketImpact analysis={analysis} />
            <EventExplanation analysis={analysis} />
            <DominoImpact analysis={analysis} />
          </motion.div>

          {/* SECTOR HEATMAP - Full width */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={revealVariants}
            className="mb-6"
          >
            <SectorHeatmap />
          </motion.div>

          {/* FOOTER - Consistent Finora branding */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="glass-panel rounded-lg p-4 mt-6"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Logo & Copyright - Using Orbitron font */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#A594F9] to-[#4B3F72]">
                  <BarChart2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p
                    className="bg-gradient-to-r from-[#F8F9FF] via-[#D9D3FF] to-[#A594F9] bg-clip-text text-sm font-black uppercase tracking-[0.15em] text-transparent"
                    style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
                  >
                    FINORA
                  </p>
                  <p className="text-[10px] text-[#b8acd8]">© 2026 Financial coaching for real-world investors</p>
                </div>
              </div>

              {/* Backend Status */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-gray-400">{pipelineLabel}</span>
                </div>
                <div className="hidden md:flex items-center gap-2 text-gray-600">
                  <span>/api/analyze_event</span>
                  <span className="text-gray-700">•</span>
                  <span>/api/portfolio/stress</span>
                </div>
              </div>

              {/* Version */}
              <div className="text-xs text-gray-500">
                Powered by FinBERT • BART • Gemini
              </div>
            </div>
          </motion.footer>
        </div>
      </div>
      <MobileNav />
    </div>
  )
}

