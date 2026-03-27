"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { 
  LayoutDashboard, 
  LineChart, 
  Radio, 
  Settings, 
  Bell,
  Wallet,
  TrendingUp,
  BarChart2
} from "lucide-react"

import MarketWatch from "../components/MarketWatch"
import GlobalIndices from "../features/market/GlobalIndices"

export default function Sidebar(){

  const pathname = usePathname()

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: LineChart, label: "Market Explorer", href: "/explorer" },
    { icon: Radio, label: "Event Analysis", href: "/event" },
    { icon: TrendingUp, label: "Predictions", href: "/predictions" },
    { icon: Wallet, label: "Portfolio Coach", href: "/portfolio" },
  ]

  const bottomItems = [
    { icon: Bell, label: "Notifications", href: "#" },
    { icon: Wallet, label: "Portfolio", href: "/portfolio" },
    { icon: Settings, label: "Settings", href: "#" },
  ]

  return (

    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-panel hidden h-screen w-[260px] flex-col overflow-y-auto border-r border-white/8 xl:flex"
    >

      {/* Logo Section */}
      <div className="border-b border-white/8 p-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#A594F9] via-[#8E7CE6] to-[#4B3F72] shadow-lg shadow-[#A594F9]/20">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="bg-gradient-to-r from-[#F8F9FF] via-[#D9D3FF] to-[#A594F9] bg-clip-text text-lg font-black uppercase tracking-[0.15em] text-transparent">
              Finora
            </h2>
            <p className="text-[10px] uppercase tracking-wider text-[#b8acd8]">Financial Coach</p>
          </div>
      </div>
      </div>
      {/* Main Navigation */}
      <nav className="p-4 space-y-1 flex-shrink-0">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            >
              <Link 
                href={item.href}
                className={
                  isActive 
                    ? "flex items-center gap-3 rounded-lg border border-[#A594F9]/20 bg-gradient-to-r from-[#A594F9]/15 to-transparent px-3 py-2.5 text-[#F8F9FF] transition-all duration-200"
                    : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#d7d0f6] transition-all duration-200 hover:bg-white/5 hover:text-white"
                }
              >
                <item.icon className={"w-4 h-4 " + (isActive ? "text-[#A594F9]" : "")} />
                <span className="text-sm font-medium tracking-wide">{item.label}</span>
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#A594F9] shadow-lg shadow-[#A594F9]/50" />
                )}
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Global Markets Widget - Inside Sidebar */}
      <div className="p-4 pt-0 flex-shrink-0">
        <MarketWatch />
      </div>

      {/* Global Indices - Inside Sidebar */}
      <div className="p-4 pt-0 flex-shrink-0">
        <GlobalIndices />
      </div>

      {/* Bottom Section */}
      <div className="mt-auto space-y-1 border-t border-white/8 p-4 flex-shrink-0">
        {bottomItems.map((item) => (
          <Link 
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[#b8acd8] transition-all duration-200 hover:bg-white/5 hover:text-white"
          >
            <item.icon className="w-3.5 h-3.5" />
            <span className="text-xs font-medium tracking-wide">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Version Info */}
      <div className="p-4 text-center flex-shrink-0">
        <p className="text-[10px] text-[#8b80aa]">Finora v3.0 • Live coaching layer</p>
      </div>

    </motion.aside>

  )

}
