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
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-50" />
      
      <div className="p-4">
        <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-4 font-medium">
          {title}
        </h3>
        {children}
      </div>
    </motion.div>
  )
}

