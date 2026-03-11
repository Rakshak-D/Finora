"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

import Topbar from "../../components/Topbar"
import Sidebar from "../../layout/Sidebar"
import MarketTicker from "../../components/MarketTicker"
import { getMarketData, getSectorData, getPredictions } from "../../services/api"

import { TrendingUp, TrendingDown, Brain, Target, Calendar, ChevronRight, BarChart2, Zap } from "lucide-react"

export default function PredictionsPage() {

const [predictions, setPredictions] = useState([
  { symbol: "NIFTY", current: "24,215", predicted: "24,800", change: "+2.4%", confidence: 82, trend: "up" },
  { symbol: "SENSEX", current: "78,096", predicted: "79,500", change: "+1.8%", confidence: 78, trend: "up" },
  { symbol: "BANKNIFTY", current: "52,340", predicted: "51,200", change: "-2.2%", confidence: 71, trend: "down" },
  { symbol: "NASDAQ", current: "22,695", predicted: "23,200", change: "+2.2%", confidence: 85, trend: "up" },
  { symbol: "BTC", current: "$92,415", predicted: "$98,000", change: "+6.0%", confidence: 76, trend: "up" },
])

const [sectorPredictions, setSectorPredictions] = useState([
  { sector: "Technology", prediction: "Bullish", confidence: 84, target: "2 months" },
  { sector: "Banking", prediction: "Neutral", confidence: 62, target: "1 month" },
  { sector: "Energy", prediction: "Bullish", confidence: 78, target: "3 months" },
  { sector: "Pharma", prediction: "Bearish", confidence: 58, target: "1 month" },
  { sector: "Auto", prediction: "Bullish", confidence: 72, target: "2 months" },
])

const [loading, setLoading] = useState(true)

useEffect(() => {
  const fetchData = async () => {
    try {
      // Fetch market data for predictions
      const marketData = await getMarketData()
      const sectorData = await getSectorData()
      
      if (Array.isArray(marketData) && marketData.length > 0) {
        const mapped = marketData.slice(0, 5).map((item: Record<string, unknown>) => {
          const changePct = Number(item.change_pct) || 0
          const predicted = parseFloat(String(item.price || "0").replace(/,/g, "")) * (1 + changePct / 100)
          return {
            symbol: String(item.symbol || ""),
            current: String(item.price || ""),
            predicted: predicted.toLocaleString('en-US', { maximumFractionDigits: 2 }),
            change: `${changePct >= 0 ? "+" : ""}${changePct.toFixed(1)}%`,
            confidence: Math.min(95, Math.max(50, 70 + Math.abs(changePct) * 10)),
            trend: changePct >= 0 ? "up" : "down"
          }
        })
        setPredictions(mapped)
      }
      
      if (Array.isArray(sectorData) && sectorData.length > 0) {
        const mapped = sectorData.slice(0, 5).map((item: Record<string, unknown>) => {
          const change = Number(item.change) || 0
          return {
            sector: String(item.name || ""),
            prediction: change > 1 ? "Bullish" : change < -1 ? "Bearish" : "Neutral",
            confidence: Math.min(95, Math.max(50, 60 + Math.abs(change) * 10)),
            target: change > 1 ? "2 months" : change < -1 ? "1 month" : "1 month"
          }
        })
        setSectorPredictions(mapped)
      }
    } catch (error) {
      console.error("Failed to fetch predictions data:", error)
    } finally {
      setLoading(false)
    }
  }
  
  fetchData()
  
  // Refresh every 60 seconds
  const interval = setInterval(fetchData, 60000)
  return () => clearInterval(interval)
}, [])

const historicalAccuracy = [
  { period: "Last Week", accuracy: 87 },
  { period: "Last Month", accuracy: 82 },
  { period: "Last Quarter", accuracy: 78 },
  { period: "Last Year", accuracy: 74 },
]

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
          Predictions
        </h1>
        <p className="text-sm text-gray-400 mt-1">AI-powered market predictions and forecasts</p>
      </motion.div>

      {/* Accuracy Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {historicalAccuracy.map((item, i) => (
          <div key={i} className="glass-panel rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{item.period}</p>
            <p className="text-2xl font-bold text-white">{item.accuracy}%</p>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Main Predictions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass-panel rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Market Predictions</h2>
              <p className="text-xs text-gray-400">AI-generated predictions for next trading session</p>
            </div>
          </div>

          <div className="space-y-3">
            {predictions.map((pred, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    pred.trend === 'up' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {pred.trend === 'up' ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{pred.symbol}</p>
                    <p className="text-xs text-gray-400">Current: {pred.current}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-sm font-bold ${
                    pred.trend === 'up' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {pred.change}
                  </p>
                  <p className="text-xs text-gray-400">Target: {pred.predicted}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-16 bg-white/10 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        pred.confidence >= 80 ? 'bg-green-500' :
                        pred.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${pred.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 mono">{pred.confidence}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Side Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-medium text-white">Model Performance</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Total Predictions</span>
                <span className="text-sm font-bold text-white">1,247</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Accuracy Rate</span>
                <span className="text-sm font-bold text-green-400">82%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Active Models</span>
                <span className="text-sm font-bold text-white">12</span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-medium text-white">Upcoming Predictions</span>
            </div>
            <div className="space-y-2">
              {sectorPredictions.slice(0, 4).map((sector, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                  <div>
                    <p className="text-xs text-gray-300">{sector.sector}</p>
                    <p className="text-[10px] text-gray-500">{sector.target}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sector Predictions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-panel rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BarChart2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Sector Predictions</h2>
          </div>
          <button className="text-xs text-blue-400 hover:text-blue-300">View All</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {sectorPredictions.map((sector, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{sector.sector}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  sector.prediction === 'Bullish' ? 'bg-green-500/20 text-green-400' :
                  sector.prediction === 'Bearish' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {sector.prediction}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{sector.target}</span>
                <span className="text-xs text-gray-400 mono">{sector.confidence}%</span>
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
