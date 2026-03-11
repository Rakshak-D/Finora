const API_URL = "http://localhost:8000"

// Event Analysis - Analyzes news/events for market impact
export async function analyzeEvent(text: string) {
  const res = await fetch(`${API_URL}/analyze-event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  })

  if (!res.ok) {
    throw new Error("API request failed")
  }

  return res.json()
}

// Event Analysis API - Full endpoint
export async function analyzeEventAPI(text: string) {
  const res = await fetch(`${API_URL}/api/event-analysis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ event: text })
  })

  if (!res.ok) {
    throw new Error("Event analysis failed")
  }

  return res.json()
}

// Market Impact Prediction
export async function getMarketImpact(eventId: string) {
  const res = await fetch(`${API_URL}/api/market-impact?event_id=${eventId}`)

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
export async function getHistoricalEvents() {
  const res = await fetch(`${API_URL}/api/historical-events`)

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

// Domino Impact Chain
export async function getDominoImpact(eventId: string) {
  const res = await fetch(`${API_URL}/api/domino-impact?event_id=${eventId}`)

  if (!res.ok) {
    throw new Error("Domino impact request failed")
  }

  return res.json()
}

// AI Confidence Scores
export async function getConfidenceScores() {
  const res = await fetch(`${API_URL}/api/confidence`)

  if (!res.ok) {
    throw new Error("Confidence scores request failed")
  }

  return res.json()
}

// Market Predictions
export async function getPredictions() {
  const res = await fetch(`${API_URL}/api/predictions`)

  if (!res.ok) {
    throw new Error("Predictions request failed")
  }

  return res.json()
}

// Health Check
export async function healthCheck() {
  const res = await fetch(`${API_URL}/health`)

  if (!res.ok) {
    throw new Error("Health check failed")
  }

  return res.json()
}

