"use client"

import { useMutation } from "@tanstack/react-query"

import { apiFetch } from "@/lib/api/client"
import { portfolioStressSchema, type PortfolioStress } from "@/lib/api/schemas"

type StressBody = {
  news_text: string
  persona: {
    sectors: string[]
    risk_appetite?: "conservative" | "moderate" | "aggressive"
    portfolio_value?: number
    holdings?: { ticker: string; quantity: number; avg_buy_price: number }[]
  }
}

export function usePortfolioCoach() {
  return useMutation({
    mutationFn: (body: StressBody) =>
      apiFetch<PortfolioStress>("/api/portfolio/stress", {
        method: "POST",
        body: JSON.stringify(body),
        schema: portfolioStressSchema,
      }),
  })
}
