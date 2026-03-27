"use client"

import { AlertCircle, BookOpenText, Compass, Sparkles } from "lucide-react"

import type { NewsInsight } from "@/lib/api/schemas"

type Props = {
  insight: NewsInsight
  activeNodeReason?: string | null
}

export default function CoachBriefPanel({ insight, activeNodeReason }: Props) {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-xl bg-[#A594F9]/15 p-2 text-[#D9D3FF]">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D9D3FF]">Why Should I Care?</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{insight.one_line_take}</h3>
        </div>
      </div>

      <div className="space-y-3 text-sm text-slate-300">
        <div className="rounded-xl border border-white/8 bg-white/4 p-4">
          <div className="mb-2 flex items-center gap-2 text-slate-100">
            <AlertCircle className="h-4 w-4 text-cyan-300" />
            <span>What happened</span>
          </div>
          <p>{insight.coach_brief.what_happened}</p>
        </div>

        <div className="rounded-xl border border-white/8 bg-white/4 p-4">
          <div className="mb-2 flex items-center gap-2 text-slate-100">
            <Compass className="h-4 w-4 text-green-300" />
            <span>Why it matters</span>
          </div>
          <p>{activeNodeReason || insight.coach_brief.why_it_matters}</p>
        </div>

        <div className="rounded-xl border border-white/8 bg-white/4 p-4">
          <div className="mb-2 flex items-center gap-2 text-slate-100">
            <BookOpenText className="h-4 w-4 text-amber-300" />
            <span>What to do next</span>
          </div>
          <p>{insight.coach_brief.what_to_do_next}</p>
        </div>
      </div>

      {!!insight.coach_brief.glossary.length && (
        <div className="mt-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Explain Simply</p>
          {insight.coach_brief.glossary.map((item) => (
            <p key={item} className="text-xs text-slate-400">
              {item}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
