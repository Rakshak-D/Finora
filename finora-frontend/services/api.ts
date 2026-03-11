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

// Market Impact Prediction - Uses analyze_event result
export async function getMarketImpact(eventId?: string) {
  // This now returns data from analyze_event which contains market impact
  // For standalone use without event analysis, we call market-data
  const res = await fetch(`${API_URL}/api/market-data`)

  if (!res.ok) {
    throw new Error("Market impact request failed")
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

// Market Data (Indices, stocks, etc.)
export async function getMarketData() {
  const res = await fetch(`${API_URL}/api/market-data`)

  if (!res.ok) {
    throw new Error("Market data request failed")
  }

  return res.json()
}

// Historical Events
export async function getHistoricalEvents(limit: number = 10) {
  const res = await fetch(`${API_URL}/api/historical-events?limit=${limit}`)

  if (!res.ok) {
    throw new Error("Historical events request failed")
  }

  return res.json()
}

// Sector Performance
export async function getSectorData() {
  const res = await fetch(`${API_URL}/api/sector-data`)

  if (!res.ok) {
    throw new Error("Sector data request failed")
  }

  return res.json()
}

// Domino Impact Chain - Returns from analyze_event response
export async function getDominoImpact(eventId?: string) {
  // Domino impact is part of the analyze_event response
  // This endpoint provides a way to get it separately if needed
  const res = await fetch(`${API_URL}/api/analyze_event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      event: { text: "Get domino impact", deep_analysis: true },
      persona: null
    })
  })

  if (!res.ok) {
    throw new Error("Domino impact request failed")
  }

  const data = await res.json()
  return data.domino_chain || null
}

// AI Confidence Scores - Returns from analyze_event response
export async function getConfidenceScores() {
  // Confidence is part of the classification in analyze_event response
  const res = await fetch(`${API_URL}/api/analyze_event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      event: { text: "Get confidence scores", deep_analysis: true },
      persona: null
    })
  })

  if (!res.ok) {
    throw new Error("Confidence scores request failed")
  }

  const data = await res.json()
  return data.classification || { confidence: 0 }
}

// Market Predictions - Returns from analyze_event response
export async function getPredictions() {
  // Predictions are part of the analyze_event response
  const res = await fetch(`${API_URL}/api/analyze_event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      event: { text: "Get predictions", deep_analysis: true },
      persona: null
    })
  })

  if (!res.ok) {
    throw new Error("Predictions request failed")
  }

  const data = await res.json()
  return {
    signal_score: data.signal_score,
    sentiment: data.sentiment,
    classification: data.classification,
    history_echo: data.history_echo
  }
}

// Dashboard Stats
export async function getStats() {
  const res = await fetch(`${API_URL}/api/stats`)

  if (!res.ok) {
    throw new Error("Stats request failed")
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

// Config - Get app configuration
export async function getConfig() {
  const res = await fetch(`${API_URL}/api/config`)

  if (!res.ok) {
    throw new Error("Config request failed")
  }

  return res.json()
}

