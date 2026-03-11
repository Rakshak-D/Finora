"use client"

import dynamic from "next/dynamic"
import Panel from "../../components/Panel"
import { motion } from "framer-motion"
import { Settings, Maximize2, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false })

export default function MarketChart() {

  const [dimensions, setDimensions] = useState({ width: 500, height: 280 })

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

  const dates = [
    "2026-02-05",
    "2026-02-09",
    "2026-02-13",
    "2026-02-17",
    "2026-02-21",
    "2026-02-25",
    "2026-03-01",
    "2026-03-05",
  ]

  const prices = [
    4950, 5050, 4930, 4880, 5100, 5200, 5300, 5150
  ]

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
            <p className="text-xl font-bold text-white mono">24,215.80</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Change</p>
            <p className="text-lg font-bold text-green-400 mono">+187.45 (+0.78%)</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">High</p>
            <p className="text-lg font-semibold text-white mono">24,380.20</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Low</p>
            <p className="text-lg font-semibold text-white mono">23,980.50</p>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-white/10">
          <Plot
            data={[
              {
                x: dates,
                y: prices,
                type: "scatter",
                mode: "lines+markers",
                line: { 
                  color: "#3B82F6",
                  width: 2,
                  shape: "spline"
                },
                marker: {
                  color: "#3B82F6",
                  size: 6,
                  line: {
                    color: "#020617",
                    width: 2
                  }
                },
                fill: "tozeroy",
                fillcolor: "rgba(59, 130, 246, 0.1)"
              }
            ]}
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
