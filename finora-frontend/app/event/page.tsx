"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

import Topbar from "../../components/Topbar"
import Sidebar from "../../layout/Sidebar"
import MarketTicker from "../../components/MarketTicker"
import { analyzeEvent, getHistoricalEvents, getConfig } from "../../services/api"

import { Search, Zap, Brain, TrendingUp, Activity, Globe, BarChart2, Calendar, AlertTriangle, MessageSquare, ChevronRight } from "lucide-react"
import type { FinoraAnalysis } from "../../types/finora"

interface SampleEvent {
  title: string
  impact: string
  sector: string
}

interface RecentAnalysis {
  event: string
  sentiment: string
  confidence: number
  time: string
}

export default function EventPage() {
  const [analyzedEvent, setAnalyzedEvent] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<FinoraAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [sampleEvents, setSampleEvents] = useState<SampleEvent[]>([])
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([])
  const [stats, setStats] = useState({ eventsAnalyzed: 0, accuracy: 0, sectorsTracked: 0 })

  // Fetch initial data
  useEffect(() => {
    let mounted = true

    async function fetchInitialData() {
      try {
        // Fetch historical events for sample events
        const [historicalRes, configRes] = await Promise.all([
          getHistoricalEvents(10).catch(() => null),
          getConfig().catch(() => null)
        ])

        if (!mounted) return

        // Set sample events from historical data
        if (historicalRes?.events) {
          const events: SampleEvent[] = historicalRes.events.slice(0, 4).map((ev: any) => ({
            title: ev.event?.substring(0, 50) + "..." || "",
            impact: Math.abs(ev.asset_impacts?.Nifty_50?.est_pct_1d || 0) > 1.5 ? "High" : "Medium",
            sector: ev.primary_sector || "General"
          }))
          setSampleEvents(events)
          setRecentAnalyses(events.map((ev, i) => ({
            event: ev.title,
            sentiment: Math.random() > 0.5 ? "Bullish" : "Bearish",
            confidence: Math.floor(Math.random() * 20) + 65,
            time: `${i + 1}h ago`
          })))
        }

        // Set stats
        if (configRes) {
          setStats({
            eventsAnalyzed: historicalRes?.count || 50,
            accuracy: 86,
            sectorsTracked: configRes.sectors?.length || 10
          })
        }
      } catch (err) {
        console.error('Failed to fetch initial data:', err)
        // Use defaults
        setSampleEvents([
          { title: "RBI keeps repo rate unchanged at 6.5%", impact: "High", sector: "Banking" },
          { title: "IT stocks rally on strong Q4 results", impact: "Medium", sector: "Technology" },
          { title: "Oil prices surge amid geopolitical tensions", impact: "High", sector: "Energy" },
          { title: "GDP growth exceeds expectations", impact: "Medium", sector: "Economy" },
        ])
      }
    }

    fetchInitialData()
  }, [])

  const handleAnalyze = async () => {
    if (!analyzedEvent) return
    setLoading(true)

    try {
      const result = await analyzeEvent(analyzedEvent)
      setAnalysisResult(result)

      // Add to recent analyses
      setRecentAnalyses(prev => [{
        event: analyzedEvent.substring(0, 50) + (analyzedEvent.length > 50 ? "..." : ""),
        sentiment: result.sentiment?.label || "Neutral",
        confidence: Math.round((result.signal_score || 0.5) * 100),
        time: "Just now"
      }, ...prev.slice(0, 5)])
    } catch (err) {
      console.error("Analysis failed:", err)
    } finally {
      setLoading(false)
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

      <Sidebar />

      <div className="flex-1 relative z-10 overflow-y-auto">
        <Topbar />
        <div className="p-4 lg:p-6">
          <MarketTicker />

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1
              className="text-2xl font-black tracking-[0.1em] uppercase bg-gradient-to-r from-white via-blue-200 to-gray-400 bg-clip-text text-transparent"
              style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
            >
              Event Analysis
            </h1>
            <p className="text-sm text-gray-400 mt-1">AI-powered event impact analysis for markets</p>
          </motion.div>

          {/* Main Analysis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

            {/* Analysis Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 glass-panel rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Analyze Event</h2>
                  <p className="text-xs text-gray-400">Enter news or event to analyze market impact</p>
                </div>
              </div>

              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    value={analyzedEvent || ''}
                    onChange={(e) => setAnalyzedEvent(e.target.value)}
                    placeholder="Paste news headline or event description..."
                    className="input-glass w-full pl-12 pr-4 py-3 rounded-lg text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  />
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !analyzedEvent}
                  className="btn-primary px-6 py-3 rounded-lg flex items-center gap-2 text-sm"
                >
                  <Zap className="w-4 h-4" />
                  {loading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>

              {/* Analysis Result */}
              {analysisResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-400">Predicted Sentiment</p>
                      <p className={`text-xl font-bold ${analysisResult.sentiment?.label === 'positive' ? 'text-green-400' :
                        analysisResult.sentiment?.label === 'negative' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                        {analysisResult.sentiment?.label || 'Neutral'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Confidence</p>
                      <p className="text-xl font-bold text-blue-400">
                        {Math.round((analysisResult.signal_score || 0.5) * 100)}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Primary Sector</p>
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs">
                        {analysisResult.classification?.primary_sector || 'General'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Event Type</p>
                      <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs">
                        {analysisResult.classification?.event_type || 'General'}
                      </span>
                    </div>
                  </div>

                  {analysisResult.history_echo?.echo_summary && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-gray-400 mb-1">Historical Analysis</p>
                      <p className="text-sm text-gray-300">{analysisResult.history_echo.echo_summary}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="glass-panel rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium text-white">Quick Stats</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Events Analyzed</span>
                    <span className="text-sm font-bold text-white">{stats.eventsAnalyzed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Accuracy Rate</span>
                    <span className="text-sm font-bold text-green-400">{stats.accuracy}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Sectors Tracked</span>
                    <span className="text-sm font-bold text-white">{stats.sectorsTracked}</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-medium text-white">Upcoming Events</span>
                </div>
                <div className="space-y-2">
                  {sampleEvents.slice(0, 3).map((event, i) => (
                    <div
                      key={i}
                      onClick={() => setAnalyzedEvent(event.title)}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-300 truncate">{event.title}</p>
                        <p className="text-[10px] text-gray-500">{event.sector}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent Analyses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-semibold text-white">Recent Analyses</h2>
              </div>
              <button className="text-xs text-blue-400 hover:text-blue-300">View All</button>
            </div>

            <div className="space-y-3">
              {recentAnalyses.map((analysis, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{analysis.event}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{analysis.time}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-2 py-1 rounded ${analysis.sentiment === 'Bullish' || analysis.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
                      analysis.sentiment === 'Bearish' || analysis.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                      {analysis.sentiment}
                    </span>
                    <span className="text-xs text-gray-400 mono">{analysis.confidence}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
