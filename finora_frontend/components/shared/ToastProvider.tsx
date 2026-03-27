"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react"

type ToastTone = "success" | "error" | "info"

type ToastItem = {
  id: string
  title: string
  description?: string
  tone: ToastTone
}

type ToastContextValue = {
  pushToast: (toast: Omit<ToastItem, "id">) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneStyles: Record<ToastTone, string> = {
  success: "border-green-400/15 bg-green-500/10 text-green-100",
  error: "border-red-400/15 bg-red-500/10 text-red-100",
  info: "border-[#A594F9]/15 bg-[#A594F9]/10 text-[#F8F9FF]",
}

const toneIcon = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} satisfies Record<ToastTone, typeof Info>

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current, { ...toast, id }])
      window.setTimeout(() => dismissToast(id), 4000)
    },
    [dismissToast],
  )

  const value = useMemo(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[90] flex w-full max-w-sm flex-col gap-3">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = toneIcon[toast.tone]
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 24, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.96 }}
                className={`pointer-events-auto rounded-2xl border p-4 shadow-[0_20px_50px_rgba(3,2,8,0.4)] ${toneStyles[toast.tone]}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{toast.title}</p>
                    {toast.description ? <p className="mt-1 text-xs leading-6 text-white/70">{toast.description}</p> : null}
                  </div>
                  <button
                    aria-label="Dismiss notification"
                    onClick={() => dismissToast(toast.id)}
                    className="rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}
