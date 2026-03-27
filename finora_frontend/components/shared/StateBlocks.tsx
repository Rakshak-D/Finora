"use client"

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/8 ${className}`} />
}

export function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  )
}

export function InlineError({
  message,
  actionLabel,
  onAction,
}: {
  message: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="rounded-2xl border border-red-400/15 bg-red-500/10 p-4 text-sm text-red-100">
      <p>{message}</p>
      {actionLabel && onAction ? (
        <button onClick={onAction} className="mt-3 rounded-full border border-red-300/20 px-3 py-1.5 text-xs text-red-100 transition hover:bg-red-500/15">
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
