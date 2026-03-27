"use client"

import type { ReactNode } from "react"

import MarketTicker from "@/components/MarketTicker"
import MobileNav from "@/components/shared/MobileNav"
import Topbar from "@/components/Topbar"
import Sidebar from "@/layout/Sidebar"

type AppShellProps = {
  children: ReactNode
  showTicker?: boolean
}

export default function AppShell({ children, showTicker = true }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 background-grid opacity-30" />
        <div className="background-glow">
          <div className="glow-orb glow-orb-1" />
          <div className="glow-orb glow-orb-2" />
          <div className="glow-orb glow-orb-3" />
        </div>
      </div>

      <Sidebar />

      <div className="relative z-10 flex-1 overflow-y-auto">
        <Topbar />
        <div className="p-4 pb-24 lg:p-6 xl:pb-6">
          {showTicker ? <MarketTicker /> : null}
          {children}
        </div>
      </div>
      <MobileNav />
    </div>
  )
}
