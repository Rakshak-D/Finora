"use client"

import Panel from "../../components/Panel"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { getSectorData } from "../../services/api"

interface SectorData {
  sectors: Array<{
    name: string
    key: string
    change: number
    changePercent: number
    marketCap: string
    volume: number
    advances: number
    declines: number
  }>
  last_updated: string
}

export default function SectorHeatmap() {
  const [sectorData, setSectorData] = useState<SectorData['sectors']>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetchSectorData() {
      try {
        const data = await getSectorData() as SectorData

        if (!mounted) return

        setSectorData(data.sectors)
        setError(null)
      } catch (err) {
        if (!mounted) return
        // Silent fallback to default data when backend API is missing
        setError('Using default data')
        setSectorData(getDefaultSectors())
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

  function getDefaultSectors() {
    return [
      { name: "Technology", key: "it", change: 2.4, changePercent: 2.4, marketCap: "12.4T", volume: 35000000, advances: 25, declines: 15 },
      { name: "Banking", key: "banking", change: -1.2, changePercent: -1.2, marketCap: "8.2T", volume: 42000000, advances: 12, declines: 28 },
      { name: "Energy", key: "energy", change: 1.1, changePercent: 1.1, marketCap: "4.8T", volume: 28000000, advances: 18, declines: 12 },
      { name: "Auto", key: "auto", change: -0.6, changePercent: -0.6, marketCap: "3.1T", volume: 22000000, advances: 14, declines: 16 },
      { name: "FMCG", key: "fmcg", change: 0.8, changePercent: 0.8, marketCap: "5.6T", volume: 18000000, advances: 20, declines: 10 },
      { name: "Pharma", key: "pharma", change: 1.7, changePercent: 1.7, marketCap: "2.9T", volume: 15000000, advances: 22, declines: 8 },
      { name: "Metal", key: "metals", change: -0.9, changePercent: -0.9, marketCap: "1.8T", volume: 25000000, advances: 10, declines: 20 },
      { name: "IT", key: "it", change: 2.1, changePercent: 2.1, marketCap: "9.4T", volume: 38000000, advances: 28, declines: 12 },
      { name: "Real Estate", key: "realestate", change: 0.4, changePercent: 0.4, marketCap: "1.2T", volume: 8000000, advances: 15, declines: 10 },
      { name: "Telecom", key: "telecom", change: -0.3, changePercent: -0.3, marketCap: "2.1T", volume: 12000000, advances: 8, declines: 12 },
    ]
  }

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

  // Use default sectors while loading or on error
  const displaySectors = sectorData.length > 0 ? sectorData : (loading ? getDefaultSectors() : getDefaultSectors())

  return (
    <Panel title="Sector Heatmap">
      <div className="grid grid-cols-2 gap-2">
        {displaySectors.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            className="heatbox relative overflow-hidden"
            style={{
              background: getColor(s.change),
              padding: "12px 8px",
              borderRadius: "8px",
              textAlign: "center",
              border: `1px solid ${getBorderColor(s.change)}`,
              boxShadow: `0 4px 20px ${getColor(s.change)}40`
            }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

            <p className="text-sm font-bold text-white drop-shadow-md">
              {s.name}
            </p>

            <p className="text-lg font-bold mt-1 text-white drop-shadow-md mono">
              {s.change > 0 ? "+" : ""}
              {s.change.toFixed(1)}%
            </p>

            <p className="text-[10px] text-white/70 mt-1">
              {s.marketCap}
            </p>
          </motion.div>
        ))}
      </div>
    </Panel>
  )
}

