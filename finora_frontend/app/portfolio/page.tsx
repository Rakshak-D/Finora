"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, ShieldCheck, Trash2, WalletCards } from "lucide-react"

import AppShell from "@/components/shared/AppShell"
import { InlineError } from "@/components/shared/StateBlocks"
import { useToast } from "@/components/shared/ToastProvider"
import { APIError } from "@/lib/api/client"
import { usePortfolioCoach } from "@/hooks/usePortfolioCoach"
import { getConfig } from "@/services/api"

type HoldingRow = {
  ticker: string
  quantity: string
  avg_buy_price: string
}

const DEFAULT_HOLDING: HoldingRow = {
  ticker: "",
  quantity: "1",
  avg_buy_price: "100",
}

function formatInr(value: number) {
  return value.toLocaleString("en-IN", { maximumFractionDigits: 0 })
}

export default function PortfolioPage() {
  const { pushToast } = useToast()
  const [newsText, setNewsText] = useState("RBI keeps policy stance unchanged while inflation risks stay elevated")
  const [portfolioValue, setPortfolioValue] = useState("500000")
  const [riskAppetite, setRiskAppetite] = useState<"conservative" | "moderate" | "aggressive">("moderate")
  const [sectorOptions, setSectorOptions] = useState<string[]>([])
  const [selectedSectors, setSelectedSectors] = useState<string[]>(["banking", "it"])
  const [holdings, setHoldings] = useState<HoldingRow[]>([{ ...DEFAULT_HOLDING }])
  const [confirmRemoveIndex, setConfirmRemoveIndex] = useState<number | null>(null)

  const stress = usePortfolioCoach()

  useEffect(() => {
    let active = true
    getConfig()
      .then((config) => {
        if (!active) return
        setSectorOptions(config.sectors)
        setSelectedSectors((previous) => (previous.length ? previous : config.sectors.slice(0, 2)))
      })
      .catch(() => {
        if (!active) return
        setSectorOptions(["defence", "banking", "it", "pharma", "energy", "auto", "infra", "fmcg", "metals", "realestate"])
      })
    return () => {
      active = false
    }
  }, [])

  const validHoldings = useMemo(
    () =>
      holdings
        .filter((holding) => holding.ticker.trim())
        .map((holding) => ({
          ticker: holding.ticker.trim().toUpperCase(),
          quantity: Number(holding.quantity) || 1,
          avg_buy_price: Number(holding.avg_buy_price) || 0,
        })),
    [holdings],
  )
  const totalTrackedQty = useMemo(() => validHoldings.reduce((sum, holding) => sum + holding.quantity, 0), [validHoldings])
  const estimatedCostBasis = useMemo(
    () => validHoldings.reduce((sum, holding) => sum + holding.quantity * holding.avg_buy_price, 0),
    [validHoldings],
  )

  useEffect(() => {
    if (stress.isSuccess) {
      pushToast({ tone: "success", title: "Portfolio coach updated", description: "The latest rupee impact range is now available." })
    }
  }, [pushToast, stress.isSuccess])

  const validationMessage = !newsText.trim()
    ? "Enter a headline or macro event before running the coach."
    : newsText.trim().length < 10
      ? "Use at least 10 characters so Finora can assess the scenario."
      : !selectedSectors.length
        ? "Select at least one sector you invest in."
        : Number(portfolioValue) < 0
          ? "Portfolio value cannot be negative."
          : null

  const mutationError = stress.error instanceof APIError ? stress.error.message : null

  return (
    <AppShell>
      <div className="mt-6 space-y-6">
        <div className="rounded-[32px] hero-gradient border border-white/8 p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="rounded-3xl bg-[#A594F9]/15 p-4 text-[#D9D3FF]">
              <WalletCards className="h-6 w-6" />
            </div>
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.34em] text-[#D9D3FF]">Portfolio Coach</p>
              <h1 className="mt-3 text-3xl font-semibold text-white">Stress test your holdings with a real headline</h1>
              <p className="mt-4 text-sm leading-7 text-[#cfc7eb]">
                Build a portfolio snapshot with your sectors, risk profile, and holdings, then let Finora stress test it against a live macro headline.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="glass-panel rounded-[28px] p-6">
            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.26em] text-slate-400">Headline or event</label>
                <textarea
                  value={newsText}
                  onChange={(event) => setNewsText(event.target.value)}
                  className="input-glass min-h-[128px] w-full rounded-3xl p-4 text-sm text-white"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.26em] text-slate-400">Portfolio value (INR)</label>
                  <input
                    type="number"
                    value={portfolioValue}
                    onChange={(event) => setPortfolioValue(event.target.value)}
                    className="input-glass w-full rounded-2xl px-4 py-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.26em] text-slate-400">Risk appetite</label>
                  <select
                    value={riskAppetite}
                    onChange={(event) => setRiskAppetite(event.target.value as "conservative" | "moderate" | "aggressive")}
                    className="input-glass w-full rounded-2xl px-4 py-3 text-sm text-white"
                  >
                    <option value="conservative">Conservative</option>
                    <option value="moderate">Moderate</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-xs uppercase tracking-[0.26em] text-slate-400">Relevant sectors</label>
                <div className="flex flex-wrap gap-2">
                  {sectorOptions.map((sector) => {
                    const active = selectedSectors.includes(sector)
                    return (
                      <button
                        key={sector}
                        onClick={() =>
                          setSelectedSectors((previous) =>
                            previous.includes(sector) ? previous.filter((item) => item !== sector) : [...previous, sector],
                          )
                        }
                        className={`rounded-full px-3 py-2 text-xs capitalize transition ${
                          active
                            ? "border border-[#A594F9]/25 bg-[#A594F9]/12 text-[#F8F9FF]"
                            : "border border-white/10 bg-white/5 text-slate-300"
                        }`}
                      >
                        {sector.replaceAll("_", " ")}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="block text-xs uppercase tracking-[0.26em] text-slate-400">Holdings</label>
                  <button
                    onClick={() => setHoldings((previous) => [...previous, { ...DEFAULT_HOLDING }])}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add holding
                  </button>
                </div>

                <div className="space-y-3">
                  {holdings.map((holding, index) => (
                    <div key={`holding-${index}`} className="grid gap-3 rounded-2xl border border-white/8 bg-white/4 p-4 md:grid-cols-[1fr_0.7fr_0.8fr_auto]">
                      <input
                        type="text"
                        value={holding.ticker}
                        onChange={(event) =>
                          setHoldings((previous) =>
                            previous.map((row, rowIndex) => (rowIndex === index ? { ...row, ticker: event.target.value } : row)),
                          )
                        }
                        placeholder="Ticker (e.g. HDFCBANK.NS)"
                        className="input-glass rounded-2xl px-4 py-3 text-sm text-white"
                      />
                      <input
                        type="number"
                        value={holding.quantity}
                        onChange={(event) =>
                          setHoldings((previous) =>
                            previous.map((row, rowIndex) => (rowIndex === index ? { ...row, quantity: event.target.value } : row)),
                          )
                        }
                        placeholder="Quantity"
                        className="input-glass rounded-2xl px-4 py-3 text-sm text-white"
                      />
                      <input
                        type="number"
                        value={holding.avg_buy_price}
                        onChange={(event) =>
                          setHoldings((previous) =>
                            previous.map((row, rowIndex) => (rowIndex === index ? { ...row, avg_buy_price: event.target.value } : row)),
                          )
                        }
                        placeholder="Average buy price"
                        className="input-glass rounded-2xl px-4 py-3 text-sm text-white"
                      />
                      <button
                        onClick={() => {
                          if (confirmRemoveIndex === index) {
                            setHoldings((previous) => (previous.length === 1 ? previous : previous.filter((_, rowIndex) => rowIndex !== index)))
                            setConfirmRemoveIndex(null)
                            return
                          }
                          setConfirmRemoveIndex(index)
                        }}
                        className="rounded-2xl border border-red-400/15 bg-red-500/10 px-4 py-3 text-red-200"
                        aria-label={confirmRemoveIndex === index ? "Confirm remove holding" : "Remove holding"}
                      >
                        {confirmRemoveIndex === index ? "Confirm" : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {validationMessage ? <p className="text-xs text-amber-200">{validationMessage}</p> : null}
              {mutationError ? <InlineError message={mutationError} /> : null}

              <button
                onClick={() => {
                  if (validationMessage) {
                    pushToast({ tone: "error", title: validationMessage })
                    return
                  }
                  stress.mutate({
                    news_text: newsText,
                    persona: {
                      sectors: selectedSectors,
                      risk_appetite: riskAppetite,
                      portfolio_value: Number(portfolioValue) || 0,
                      holdings: validHoldings,
                    },
                  })
                }}
                className="btn-primary rounded-2xl px-5 py-3 text-sm"
                disabled={Boolean(validationMessage) || stress.isPending}
              >
                {stress.isPending ? "Running coach..." : "Run portfolio coach"}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel rounded-[28px] p-5">
              {stress.data ? (
                <>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-green-500/15 p-2 text-green-200">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Coach result</p>
                      <p className="text-lg font-semibold text-white">{stress.data.estimated_portfolio_impact}</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-sm text-slate-300">
                    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Primary sector</p>
                      <p className="mt-2 capitalize text-white">{stress.data.primary_sector_affected.replaceAll("_", " ")}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Estimated rupee band</p>
                      <p className="mt-2 text-white">
                        {stress.data.estimated_rupee_range.low ?? "Unavailable"} to {stress.data.estimated_rupee_range.high ?? "Unavailable"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Coach guidance</p>
                      <p className="mt-2 leading-7 text-slate-300">{stress.data.ai_advisory}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm leading-7 text-slate-400">
                  Your portfolio guidance will appear here after you send the current headline, holdings, sectors, and risk appetite to the backend.
                </p>
              )}
            </div>

            <div className="rounded-[28px] border border-[#A594F9]/12 bg-[#A594F9]/8 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[#D9D3FF]">Portfolio snapshot</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Risk profile</p>
                  <p className="mt-2 text-sm font-semibold capitalize text-white">{riskAppetite}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Headline budget</p>
                  <p className="mt-2 text-sm font-semibold text-white">₹{formatInr(Number(portfolioValue) || 0)}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Holdings tracked</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {validHoldings.length} positions • {totalTrackedQty} units
                  </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Cost basis</p>
                  <p className="mt-2 text-sm font-semibold text-white">₹{formatInr(estimatedCostBasis)}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Active sectors</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedSectors.length ? (
                    selectedSectors.map((sector) => (
                      <span key={sector} className="rounded-full border border-[#A594F9]/25 bg-[#A594F9]/12 px-3 py-1.5 text-xs capitalize text-[#F8F9FF]">
                        {sector.replaceAll("_", " ")}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">Select at least one sector to tailor the coach.</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Holdings list</p>
                <div className="mt-3 space-y-2">
                  {validHoldings.length ? (
                    validHoldings.map((holding) => (
                      <div key={`${holding.ticker}-${holding.quantity}-${holding.avg_buy_price}`} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-sm">
                        <div>
                          <p className="font-semibold text-white">{holding.ticker}</p>
                          <p className="text-xs text-slate-400">
                            {holding.quantity} units at ₹{formatInr(holding.avg_buy_price)}
                          </p>
                        </div>
                        <p className="text-xs text-[#D9D3FF]">₹{formatInr(holding.quantity * holding.avg_buy_price)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">Add at least one holding to get a personalized rupee impact estimate.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
