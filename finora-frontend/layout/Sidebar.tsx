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
  ]

  const bottomItems = [
    { icon: Bell, label: "Notifications", href: "#" },
    { icon: Wallet, label: "Portfolio", href: "#" },
    { icon: Settings, label: "Settings", href: "#" },
  ]

  return (

    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="w-[260px] h-screen glass-panel border-r border-white/5 flex flex-col overflow-y-auto"
    >

      {/* Logo Section */}
      <div className="p-4 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] via-[#06B6D4] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-blue-500/20">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-[0.15em] uppercase bg-gradient-to-r from-white via-blue-200 to-gray-400 bg-clip-text text-transparent">
              Finora
            </h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">AI Intelligence</p>
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
                    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 bg-gradient-to-r from-[#3B82F6]/20 to-transparent text-blue-400 border-l-2 border-blue-500"
                    : "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-300 hover:text-white hover:bg-white/5"
                }
              >
                <item.icon className={"w-4 h-4 " + (isActive ? "text-blue-400" : "")} />
                <span className="text-sm font-medium tracking-wide">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />
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
      <div className="p-4 border-t border-white/5 space-y-1 mt-auto flex-shrink-0">
        {bottomItems.map((item) => (
          <Link 
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <item.icon className="w-3.5 h-3.5" />
            <span className="text-xs font-medium tracking-wide">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Version Info */}
      <div className="p-4 text-center flex-shrink-0">
        <p className="text-[10px] text-gray-600">Finora v2.0 • ML Pipeline Active</p>
      </div>

    </motion.aside>

  )

}
