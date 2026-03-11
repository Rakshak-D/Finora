"use client"

import { useState } from "react"
import Panel from "../../components/Panel"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Clock, TrendingUp } from "lucide-react"

export default function NewsFeed(){

 const news = [
  {
   title:"Sensex jumps 600 points as markets rally on strong banking stocks",
   source:"Moneycontrol",
   time:"2h ago",
   sentiment:"bullish",
   image:"https://picsum.photos/800/400?1"
  },
  {
   title:"Gold prices rise amid global uncertainty and Fed rate signals",
   source:"CNBC",
   time:"4h ago",
   sentiment:"neutral",
   image:"https://picsum.photos/800/400?2"
  },
  {
   title:"Oil prices surge after Middle East supply concerns escalate",
   source:"Reuters",
   time:"5h ago",
   sentiment:"bearish",
   image:"https://picsum.photos/800/400?3"
  },
  {
   title:"Bitcoin breaks $92K as institutional ETF inflows accelerate",
   source:"CoinDesk",
   time:"1h ago",
   sentiment:"bullish",
   image:"https://picsum.photos/800/400?4"
  }
 ]

 // Headlines WITH IMAGES
 const headlines = [
  { text: "Nifty crosses 24,200 on strong banking stocks", time: "10m ago", source: "ET Markets", image: "https://picsum.photos/100/100?11" },
  { text: "Bitcoin rallies after ETF inflows surge", time: "25m ago", source: "CoinTelegraph", image: "https://picsum.photos/100/100?12" },
  { text: "Oil climbs on Middle East tensions", time: "1h ago", source: "Reuters", image: "https://picsum.photos/100/100?13" },
  { text: "Fed signals possible rate cuts this year", time: "2h ago", source: "Bloomberg", image: "https://picsum.photos/100/100?14" },
  { text: "AI stocks continue strong rally", time: "3h ago", source: "CNBC", image: "https://picsum.photos/100/100?15" }
 ]

 const [index,setIndex] = useState(0)

 function next(){
  setIndex((index+1)%news.length)
 }

 function prev(){
  setIndex((index-1+news.length)%news.length)
 }

  return(

  <Panel title="Market News">

      {/* HERO CAROUSEL - Bigger image */}
   <div className="relative mb-2">
    <AnimatePresence mode="wait">
     <motion.div
      key={index}
      initial={{ opacity: 0, x: 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="relative rounded-lg overflow-hidden"
     >
      <img
       src={news[index].image}
       className="w-full h-[280px] object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {/* Sentiment badge */}
      <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-medium ${
        news[index].sentiment === 'bullish' ? 'bg-green-500/20 text-green-400' :
        news[index].sentiment === 'bearish' ? 'bg-red-500/20 text-red-400' :
        'bg-yellow-500/20 text-yellow-400'
      }`}>
        {news[index].sentiment.toUpperCase()}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3">
       <h3 className="text-sm font-medium text-gray-200 leading-snug">
        {news[index].title}
       </h3>
       <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-300">
        <span>{news[index].source}</span>
        <span className="flex items-center gap-1">
         <Clock className="w-2.5 h-2.5" />
         {news[index].time}
        </span>
       </div>
      </div>
     </motion.div>
    </AnimatePresence>

    {/* Carousel controls */}
    <div className="flex items-center justify-between mt-2">
     <div className="flex gap-1.5">
      {news.map((_, i) => (
       <button
        key={i}
        onClick={() => setIndex(i)}
        className={`w-1.5 h-1.5 rounded-full transition-all ${
         i === index ? 'bg-blue-500 w-4' : 'bg-gray-600'
        }`}
       />
      ))}
     </div>
     <div className="flex gap-1">
      <button onClick={prev} className="p-1 rounded bg-white/5 hover:bg-white/10 transition-colors">
       <ChevronLeft className="w-3 h-3" />
      </button>
      <button onClick={next} className="p-1 rounded bg-white/5 hover:bg-white/10 transition-colors">
       <ChevronRight className="w-3 h-3" />
      </button>
     </div>
    </div>
   </div>

   {/* HEADLINES WITH BIGGER IMAGES */}
   <div className="space-y-1">
    <div className="flex items-center gap-2 mb-1">
     <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
     <span className="text-[10px] font-medium text-gray-400">Latest Headlines</span>
    </div>
    
    {headlines.map((item,i)=>(
     <motion.div
      key={i}
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.05 }}
      className="flex items-start gap-3 p-1.5 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
     >
      {/* Bigger Image for headline */}
      <img 
        src={item.image} 
        alt={item.text}
        className="w-14 h-14 rounded object-cover flex-shrink-0" 
      />
      <div className="flex-1 min-w-0">
       <p className="text-xs text-gray-300 group-hover:text-white transition-colors line-clamp-2">
        {item.text}
       </p>
       <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-gray-500">
        <span>{item.source}</span>
        <span>•</span>
        <span>{item.time}</span>
       </div>
      </div>
     </motion.div>
    ))}
   </div>

  </Panel>

 )

}

