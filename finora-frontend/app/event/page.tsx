"use client"

import { useState } from "react"
import { motion } from "framer-motion"

import Topbar from "../../components/Topbar"
import Sidebar from "../../layout/Sidebar"
import MarketTicker from "../../components/MarketTicker"

import { Search, Zap, Brain, TrendingUp, Activity, Globe, BarChart2, Calendar, AlertTriangle, MessageSquare, ChevronRight } from "lucide-react"

export default function EventPage() {

const [analyzedEvent, setAnalyzedEvent] = useState<string | null>(null)
const [analysisResult, setAnalysisResult] = useState<{ sentiment: "Bullish" | "Bearish" | "Neutral"; confidence: number; sectors: string[]; impact: "Low" | "Medium" | "High" } | null>(null)
const [loading, setLoading] = useState(false)

const sampleEvents = [
  { title: "RBI keeps repo rate unchanged at 6.5%", impact: "High", sector: "Banking" },
  { title: "IT stocks rally on strong Q4 results", impact: "Medium", sector: "Technology" },
  { title: "Oil prices surge amid geopolitical tensions", impact: "High", sector: "Energy" },
  { title: "GDP growth exceeds expectations", impact: "Medium", sector: "Economy" },
]

const recentAnalyses = [
  { event: "Fed signals rate cut in upcoming meeting", sentiment: "Bullish", confidence: 78, time: "2h ago" },
  { event: "Bank merger news impacts sector", sentiment: "Neutral", confidence: 65, time: "5h ago" },
  { event: "Tech export restrictions announced", sentiment: "Bearish", confidence: 82, time: "1d ago" },
]

const handleAnalyze = async () => {
  if (!analyzedEvent) return
  setLoading(true)
  // Simulate API call
  setTimeout(() => {
    setAnalysisResult({
      sentiment: Math.random() > 0.5 ? "Bullish" : "Bearish",
      confidence: Math.floor(Math.random() * 30) + 60,
      sectors: ["Banking", "Technology", "Energy"],
      impact: "Medium"
    })
    setLoading(false)
  }, 1500)
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

  <Sidebar/>

  <div className="flex-1 relative z-10 overflow-y-auto">

    <Topbar/>

    <div className="p-4 lg:p-6">

      <MarketTicker/>

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
                  <p className={`text-xl font-bold ${analysisResult.sentiment === 'Bullish' ? 'text-green-400' : 'text-red-400'}`}>
                    {analysisResult.sentiment}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Confidence</p>
                  <p className="text-xl font-bold text-blue-400">{analysisResult.confidence}%</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-2">Affected Sectors</p>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.sectors.map((sector: string, i: number) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs">
                        {sector}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-2">Impact Level</p>
                  <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                    {analysisResult.impact}
                  </span>
                </div>
              </div>
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
                <span className="text-sm font-bold text-white">1,247</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Accuracy Rate</span>
                <span className="text-sm font-bold text-green-400">86%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Sectors Tracked</span>
                <span className="text-sm font-bold text-white">12</span>
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
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
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
                <span className={`text-xs px-2 py-1 rounded ${
                  analysis.sentiment === 'Bullish' ? 'bg-green-500/20 text-green-400' :
                  analysis.sentiment === 'Bearish' ? 'bg-red-500/20 text-red-400' :
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
