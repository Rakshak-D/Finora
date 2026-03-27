"use client"

import { useEffect, useState } from "react"

import type { MarketSnapshot } from "@/lib/api/schemas"
import { API_URL } from "@/lib/api/client"

export function useMarketStream(enabled: boolean = false) {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null)

  useEffect(() => {
    if (!enabled) return

    const source = new EventSource(`${API_URL}/api/stream/market`)
    source.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data)
        setSnapshot(parsed.payload as MarketSnapshot)
      } catch {}
    }

    return () => {
      source.close()
    }
  }, [enabled])

  return snapshot
}
