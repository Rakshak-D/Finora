"use client"

import { motion } from "framer-motion"

interface PanelProps {
  title: string
  children: React.ReactNode
  className?: string
}

export default function Panel({ title, children, className = "" }: PanelProps) {

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.5, 
        ease: [0.4, 0, 0.2, 1]
      }}
      className={`glass-panel rounded-xl overflow-hidden ${className}`}
    >
      {/* Gradient top border */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#A594F9] to-transparent opacity-70" />
      
      <div className="p-4">
        <h3 className="mb-4 text-xs font-medium uppercase tracking-widest text-[#d9d3ff]">
          {title}
        </h3>
        {children}
      </div>
    </motion.div>
  )
}

