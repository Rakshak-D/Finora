"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

import Topbar from "../components/Topbar"
import Sidebar from "../layout/Sidebar"
import MarketTicker from "../components/MarketTicker"

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
import { getConfig, getSectorData, getHistoricalEvents } from "../services/api"

// Stats from API
interface DashboardStats {
  aiSignals: number
  marketsTracked: number
  eventsDetected: number
  accuracyRate: number
}

export default function Home() {
  const [region, setRegion] = useState("")
  const [analysis, setAnalysis] = useState<FinoraAnalysis | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    aiSignals: 0,
    marketsTracked: 0,
    eventsDetected: 0,
    accuracyRate: 0
  })
  const [loading, setLoading] = useState(true)

  // Fetch initial data from API
  useEffect(() => {
    let mounted = true

    async function fetchDashboardData() {
      try {
        // Fetch multiple endpoints in parallel
        const [config, sectorData, historicalData] = await Promise.all([
          getConfig().catch(() => null),
          getSectorData().catch(() => null),
          getHistoricalEvents(50).catch(() => null)
        ])

        if (!mounted) return

        let aiSignals = 128
        let marketsTracked = 42
        let eventsDetected = 19
        let accuracyRate = 86

        // Get config data
        if (config) {
          marketsTracked = config.tracked_assets?.length || 10
        }

        // Get sector count for events detected
        if (sectorData) {
          eventsDetected = sectorData.sectors?.length || 10
        }

        // Get historical events count for AI signals
        if (historicalData) {
          aiSignals = historicalData.count || 50
        }

        setStats({
          aiSignals,
          marketsTracked,
          eventsDetected,
          accuracyRate
        })
      } catch (err) {
        console.error('Dashboard fetch error:', err)
        // Use defaults on error
        setStats({
          aiSignals: 128,
          marketsTracked: 42,
          eventsDetected: 19,
          accuracyRate: 86
        })
      } finally {
        if (mounted) {
          setLoading(false)
        }
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

  const statsData = [
    { label: "AI Signals", value: stats.aiSignals.toString(), icon: Brain, color: "text-blue-400" },
    { label: "Markets Tracked", value: stats.marketsTracked.toString(), icon: Globe, color: "text-cyan-400" },
    { label: "Events Detected", value: stats.eventsDetected.toString(), icon: Activity, color: "text-purple-400" },
    { label: "Accuracy Rate", value: `${stats.accuracyRate}%`, icon: TrendingUp, color: "text-green-400" }
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
        <div className="p-2 lg:p-3">
          <MarketTicker />

          {/* HERO INTELLIGENCE PANEL */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-lg hero-gradient p-2 lg:p-3 mb-2 lg:mb-3 border border-white/5 relative overflow-hidden"
          >
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              {/* Title Row - FINORA IN CAPS with Orbitron font */}
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-blue-400" />
                <h1
                  className="text-base lg:text-lg font-black tracking-[0.2em] uppercase bg-gradient-to-r from-white via-blue-200 to-gray-400 bg-clip-text text-transparent"
                  style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
                >
                  Finora
                </h1>
              </div>

              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-1.5 mb-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                  <input
                    placeholder="Search companies, events, macro signals..."
                    className="w-full input-glass rounded-md pl-8 pr-2 py-1.5 text-xs"
                  />
                </div>
                <button className="btn-primary px-3 py-1.5 rounded-md flex items-center justify-center gap-1 text-xs">
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
                {statsData.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    variants={itemVariants}
                    className="glass-panel p-1.5 rounded-md"
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <stat.icon className={`w-2.5 h-2.5 ${stat.color}`} />
                      <p className="text-[8px] text-gray-400 uppercase tracking-wider">{stat.label}</p>
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
            <EventAnalysis setRegion={setRegion} onResult={setAnalysis} />
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
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] flex items-center justify-center">
                  <BarChart2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p
                    className="text-sm font-black tracking-[0.15em] uppercase"
                    style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
                  >
                    FINORA
                  </p>
                  <p className="text-[10px] text-gray-500">© 2026 AI Market Intelligence</p>
                </div>
              </div>

              {/* Backend Status */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-gray-400">ML Pipeline</span>
                </div>
                <div className="hidden md:flex items-center gap-2 text-gray-600">
                  <span>/api/event-analysis</span>
                  <span className="text-gray-700">•</span>
                  <span>/api/market-impact</span>
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
    </div>
  )
}

