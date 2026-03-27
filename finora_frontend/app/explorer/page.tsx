"use client"

import { useEffect, useState } from "react"

import AppShell from "@/components/shared/AppShell"
import { InlineError } from "@/components/shared/StateBlocks"
import MarketChart from "@/features/market/MarketChart"
import { getMarketSnapshot } from "@/services/api"
import { APIError } from "@/lib/api/client"

type AssetOption = {
  id: string
  label: string
}

export default function Explorer() {
  const [asset, setAsset] = useState("Nifty_50")
  const [timeframe, setTimeframe] = useState("1D")
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState<AssetOption[]>([
    { id: "Nifty_50", label: "Nifty 50" },
    { id: "Gold_INR", label: "Gold INR" },
    { id: "Crypto", label: "Bitcoin" },
    { id: "Crude_Oil", label: "Crude Oil" },
  ])

  useEffect(() => {
    let active = true
    getMarketSnapshot()
      .then((snapshot) => {
        if (!active) return
        setOptions(
          snapshot.instruments.map((instrument) => ({
            id: instrument.id,
            label: instrument.display_name,
          })),
        )
        setError(null)
      })
      .catch((cause) => {
        if (!active) return
        setError(cause instanceof APIError ? cause.message : "Market instruments could not be loaded.")
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <AppShell>
      <div className="mt-6 space-y-6">
        <div className="max-w-5xl rounded-[32px] hero-gradient border border-white/8 p-6">
          <p className="text-xs uppercase tracking-[0.34em] text-[#D9D3FF]">Market Explorer</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Feel the movement, not just the number.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#cfc7eb]">
            Choose from the live market snapshot and explore one asset across multiple chart horizons.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <select value={asset} onChange={(event) => setAsset(event.target.value)} className="input-glass rounded-2xl px-4 py-3 text-sm text-white">
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <select value={timeframe} onChange={(event) => setTimeframe(event.target.value)} className="input-glass rounded-2xl px-4 py-3 text-sm text-white">
            <option value="1D">1D</option>
            <option value="1W">1W</option>
            <option value="1M">1M</option>
            <option value="1Y">1Y</option>
          </select>
        </div>
        {error ? <InlineError message={error} /> : null}

        <div className="max-w-6xl">
          <MarketChart asset={asset} timeframe={timeframe} />
        </div>
      </div>
    </AppShell>
  )
}
