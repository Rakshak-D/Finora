"use client"

import Panel from "../../components/Panel"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { getSectorData } from "../../services/api"

interface SectorData {
  sectors: Array<{
    name: string
    key: string
    change: number | null | undefined
    changePercent: number | null | undefined
    marketCap: string
    volume: number | null | undefined
    advances: number | null | undefined
    declines: number | null | undefined
  }>
  last_updated: string
}

export default function SectorHeatmap() {
  const [sectorData, setSectorData] = useState<SectorData['sectors']>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function fetchSectorData() {
      try {
        const data = await getSectorData()

        if (!mounted) return

        setSectorData(data.sectors.filter((sector) => sector.change != null))
      } catch {
        if (!mounted) return
        setSectorData([])
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchSectorData()

    // Refresh every 60 seconds
    const interval = setInterval(fetchSectorData, 60000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  function getColor(change: number) {
    if (change >= 2) return "rgba(34, 197, 94, 0.9)"
    if (change >= 1) return "rgba(74, 222, 128, 0.8)"
    if (change >= 0) return "rgba(134, 239, 172, 0.7)"
    if (change >= -1) return "rgba(248, 113, 113, 0.7)"
    return "rgba(239, 68, 68, 0.9)"
  }

  function getBorderColor(change: number) {
    if (change >= 2) return "rgba(34, 197, 94, 0.5)"
    if (change >= 1) return "rgba(74, 222, 128, 0.4)"
    if (change >= 0) return "rgba(134, 239, 172, 0.3)"
    if (change >= -1) return "rgba(248, 113, 113, 0.3)"
    return "rgba(239, 68, 68, 0.5)"
  }

  const displaySectors = sectorData

  return (
    <Panel title="Sector Heatmap">
      <div className="grid grid-cols-2 gap-2">
        {displaySectors.map((s, i) => {
          const change = s.change ?? 0
          return <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            className="heatbox relative overflow-hidden"
            style={{
              background: getColor(change),
              padding: "12px 8px",
              borderRadius: "8px",
              textAlign: "center",
              border: `1px solid ${getBorderColor(change)}`,
              boxShadow: `0 4px 20px ${getColor(change)}40`
            }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

            <p className="text-sm font-bold text-white drop-shadow-md">
              {s.name}
            </p>

            <p className="text-lg font-bold mt-1 text-white drop-shadow-md mono">
              {change > 0 ? "+" : ""}
              {change.toFixed(1)}%
            </p>

            <p className="text-[10px] text-white/70 mt-1">
              {s.marketCap}
            </p>
          </motion.div>
        })}
        {!displaySectors.length && !loading ? (
          <div className="col-span-2 rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">
            Sector momentum will appear here once live sector data is available.
          </div>
        ) : null}
      </div>
    </Panel>
  )
}

