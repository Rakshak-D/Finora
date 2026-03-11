export type RiskAppetite = "conservative" | "moderate" | "aggressive"

export type InvestorPersona = {
  sectors: string[]
  risk_appetite?: RiskAppetite
  holdings?: { ticker: string; quantity: number; avg_buy_price: number }[]
  portfolio_value?: number
}

export type SentimentLabel = "positive" | "negative" | "neutral" | string

export type FinoraAnalysis = {
  input_text?: string
  sentiment?: { label?: SentimentLabel; score?: number; raw_label?: string }
  classification?: {
    primary_sector?: string
    event_type?: string
    confidence?: number
    all_sector_scores?: Record<string, number>
  }
  domino_chain?: {
    trigger_sector?: string
    chain?: { sector?: string; direction?: "up" | "down" | "flat" | string; magnitude?: string; reason?: string }[]
    user_impact?: string | null
  } | null
  history_echo?: {
    parallels?: {
      event_date?: string
      event_summary?: string
      sector?: string
      similarity_score?: number
      price_changes?: Record<string, number>
      portfolio_gain_inr?: number | null
    }[]
    avg_sector_move_pct?: number
    echo_summary?: string
  } | null
  persona_summary?: string | null
  persona_relevance?: number | null
  signal_score?: number
}

