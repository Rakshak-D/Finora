import type { InvestorPersona, FinoraAnalysis } from "../types/finora"

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "")

// Core Event Analysis (FastAPI): /api/analyze_event expects { event: {text, deep_analysis}, persona? }
export async function analyzeEvent(text: string, persona?: InvestorPersona | null): Promise<FinoraAnalysis> {
  const res = await fetch(`${API_URL}/api/analyze_event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      event: { text, deep_analysis: true },
      persona: persona ?? null
    })
  })

  if (!res.ok) {
    let detail = "API request failed"
    try {
      const j = await res.json()
      if (typeof j?.detail === "string") detail = j.detail
    } catch {}
    throw new Error(detail)
  }

  return res.json()
}

// Back-compat wrapper (some components call this)
export async function analyzeEventAPI(text: string, persona?: InvestorPersona | null) {
  return analyzeEvent(text, persona)
}

// Market Data - Returns indices and major assets
export async function getMarketData() {
  const res = await fetch(`${API_URL}/api/market-data`)

  if (!res.ok) {
    throw new Error("Market data request failed")
  }

  return res.json()
}

// News Feed
export async function getNews() {
  const res = await fetch(`${API_URL}/api/news`)

  if (!res.ok) {
    throw new Error("News request failed")
  }

  return res.json()
}

// Historical Events
export async function getHistoricalEvents(limit: number = 20) {
  const res = await fetch(`${API_URL}/api/historical-events?limit=${limit}`)

  if (!res.ok) {
    throw new Error("Historical events request failed")
  }

  return res.json()
}

// Sector Performance Data
export async function getSectorData() {
  const res = await fetch(`${API_URL}/api/sector-data`)

  if (!res.ok) {
    throw new Error("Sector data request failed")
  }

  return res.json()
}

// Market Impact - Uses analyze_event endpoint
export async function getMarketImpact(eventId: string) {
  // Use the analyze_event endpoint to get market impact
  // The eventId could be used to fetch a specific event analysis
  const res = await fetch(`${API_URL}/api/analyze_event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      event: { text: eventId, deep_analysis: true },
      persona: null
    })
  })

  if (!res.ok) {
    throw new Error("Market impact request failed")
  }

  return res.json()
}

// Domino Impact - Uses analyze_event endpoint  
export async function getDominoImpact(eventId: string) {
  const res = await fetch(`${API_URL}/api/analyze_event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      event: { text: eventId, deep_analysis: true },
      persona: null
    })
  })

  if (!res.ok) {
    throw new Error("Domino impact request failed")
  }

  return res.json()
}

// AI Confidence Scores - Uses analyze_event endpoint
export async function getConfidenceScores() {
  const res = await fetch(`${API_URL}/api/analyze_event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      event: { text: "market analysis", deep_analysis: true },
      persona: null
    })
  })

  if (!res.ok) {
    throw new Error("Confidence scores request failed")
  }

  return res.json()
}

// Market Predictions - Uses analyze_event endpoint
export async function getPredictions() {
  const res = await fetch(`${API_URL}/api/analyze_event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      event: { text: "market prediction", deep_analysis: true },
      persona: null
    })
  })

  if (!res.ok) {
    throw new Error("Predictions request failed")
  }

  return res.json()
}

// Health Check
export async function healthCheck() {
  const res = await fetch(`${API_URL}/api/health`)

  if (!res.ok) {
    throw new Error("Health check failed")
  }

  return res.json()
}

// Config - Get application configuration
export async function getConfig() {
  const res = await fetch(`${API_URL}/api/config`)

  if (!res.ok) {
    throw new Error("Config request failed")
  }

  return res.json()
}

