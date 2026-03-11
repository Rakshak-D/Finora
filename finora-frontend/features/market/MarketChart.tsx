"use client"

import dynamic from "next/dynamic"
import Panel from "../../components/Panel"
import { motion } from "framer-motion"
import { Settings, Maximize2, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

interface MarketData {
  indices: Array<{
    symbol: string
    name: string
    price: number
    change: number
    changePercent: number
    high: number
    low: number
  }>
  last_updated: string
}

export default function MarketChart() {
  const [dimensions, setDimensions] = useState({ width: 500, height: 280 })
  const [marketData, setMarketData] = useState<MarketData['indices'][0] | null>(null)
  const [chartData, setChartData] = useState<{ dates: string[]; prices: number[] }>({
    dates: [],
    prices: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    function handleResize() {
      const sidebarWidth = 260
      const padding = 24
      const availableWidth = window.innerWidth - sidebarWidth - padding
      const newWidth = Math.min(availableWidth * 0.98, 700)
      setDimensions({ width: newWidth, height: 280 })
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    let mounted = true
    
    async function fetchMarketData() {
      try {
        const response = await fetch('/api/market-data')
        if (!response.ok) {
          throw new Error('Failed to fetch market data')
        }
        
        const data: MarketData = await response.json()
        
        if (!mounted) return
        
        // Get Nifty 50 data
        const niftyData = data.indices.find(idx => idx.symbol === 'NIFTY')
        if (niftyData) {
          setMarketData(niftyData)
          
          // Generate simulated chart data based on current price
          const basePrice = niftyData.price
          const dates: string[] = []
          const prices: number[] = []
          
          // Generate 8 data points for the chart
          for (let i = 0; i < 8; i++) {
            const date = new Date()
            date.setDate(date.getDate() - (7 - i) * 3)
            dates.push(date.toISOString().split('T')[0])
            
            // Generate realistic price variations around the base price
            const variation = (Math.random() - 0.5) * basePrice * 0.02
            prices.push(basePrice + variation + (i - 4) * basePrice * 0.005)
          }
          
          setChartData({ dates, prices })
        }
        setLoading(false)
      } catch (err) {
        if (!mounted) return
        console.error('Market chart error:', err)
        // Use default data on error
        setMarketData({
          symbol: 'NIFTY',
          name: 'Nifty 50',
          price: 24215.80,
          change: 187.45,
          changePercent: 0.78,
          high: 24380.20,
          low: 23980.50
        })
        setChartData({
          dates: [
            "2026-02-05",
            "2026-02-09", 
            "2026-02-13",
            "2026-02-17",
            "2026-02-21",
            "2026-02-25",
            "2026-03-01",
            "2026-03-05",
          ],
          prices: [4950, 5050, 4930, 4880, 5100, 5200, 5300, 5150]
        })
        setLoading(false)
      }
    }

    fetchMarketData()
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchMarketData, 60000)
    
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  function formatPrice(price: number): string {
    return price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // Use default data while loading
  const displayData = marketData || {
    symbol: 'NIFTY',
    name: 'Nifty 50',
    price: 24215.80,
    change: 187.45,
    changePercent: 0.78,
    high: 24380.20,
    low: 23980.50
  }

  const dates = chartData.dates.length > 0 ? chartData.dates : [
    "2026-02-05",
    "2026-02-09",
    "2026-02-13",
    "2026-02-17",
    "2026-02-21",
    "2026-02-25",
    "2026-03-01",
    "2026-03-05",
  ]

  const prices = chartData.prices.length > 0 ? chartData.prices : [
    4950, 5050, 4930, 4880, 5100, 5200, 5300, 5150
  ]

  const isPositive = displayData.changePercent >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Panel title="Market Explorer">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400">NIFTY 50 • Intraday</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Maximize2 className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Settings className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6 mb-4">
          <div>
            <p className="text-xs text-gray-400">Current</p>
            <p className="text-xl font-bold text-white mono">{formatPrice(displayData.price)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Change</p>
            <p className={`text-lg font-bold mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{displayData.change.toFixed(2)} ({displayData.changePercent >= 0 ? '+' : ''}{displayData.changePercent.toFixed(2)}%)
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">High</p>
            <p className="text-lg font-semibold text-white mono">{formatPrice(displayData.high)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Low</p>
            <p className="text-lg font-semibold text-white mono">{formatPrice(displayData.low)}</p>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-white/10">
          <Plot
            data={[{
              x: dates,
              y: prices,
              type: "scatter",
              mode: "lines+markers",
              line: { 
                color: isPositive ? "#22c55e" : "#ef4444",
                width: 2,
                shape: "spline"
              },
              marker: {
                color: isPositive ? "#22c55e" : "#ef4444",
                size: 6,
                line: {
                  color: "#020617",
                  width: 2
                }
              },
              fill: "tozeroy",
              fillcolor: isPositive ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)"
            }]}
            layout={{
              paper_bgcolor: "transparent",
              plot_bgcolor: "rgba(2, 6, 23, 0.5)",
              font: { color: "#9CA3AF" },
              width: dimensions.width,
              height: dimensions.height,
              margin: { t: 20, r: 20, b: 40, l: 60 },
              xaxis: {
                gridcolor: "rgba(255, 255, 255, 0.05)",
                linecolor: "rgba(255, 255, 255, 0.1)",
                tickfont: { size: 10 }
              },
              yaxis: {
                gridcolor: "rgba(255, 255, 255, 0.05)",
                linecolor: "rgba(255, 255, 255, 0.1)",
                tickfont: { size: 10 }
              },
              showlegend: false,
              hovermode: "x unified"
            }}
            config={{
              displayModeBar: false,
              responsive: true
            }}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </Panel>
    </motion.div>
  )
}

