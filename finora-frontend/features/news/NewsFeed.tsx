"use client"

import { useState } from "react"
import Panel from "../../components/Panel"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Clock, TrendingUp } from "lucide-react"
import { useEffect } from "react"
import { getNews } from "../../services/api"

export default function NewsFeed(){

 type NewsCard = { title: string; source: string; time: string; sentiment: "bullish" | "bearish" | "neutral"; image: string; _thumb: string }
 type Headline = { text: string; time: string; source: string; image: string }

 const [news, setNews] = useState<NewsCard[]>([])
 const [headlines, setHeadlines] = useState<Headline[]>([])

 function timeAgo(iso?: string){
  if(!iso) return ""
  try{
   const d = new Date(iso)
   const diff = Date.now() - d.getTime()
   const m = Math.max(0, Math.floor(diff/60000))
   if(m < 1) return "Just now"
   if(m < 60) return `${m}m ago`
   const h = Math.floor(m/60)
   if(h < 24) return `${h}h ago`
   const dd = Math.floor(h/24)
   return `${dd}d ago`
  }catch{
   return ""
  }
 }

 function imageFor(seed: string, w: number, h: number){
  const safe = encodeURIComponent(seed.slice(0, 40))
  return `https://picsum.photos/seed/${safe}/${w}/${h}`
 }

 function guessSentiment(title: string){
  const t = (title || "").toLowerCase()
  if(/surge|rally|jump|beats|record|gains|soar|up/.test(t)) return "bullish"
  if(/crash|falls?|selloff|miss|down|plunge|slump|cut/.test(t)) return "bearish"
  return "neutral"
 }

 useEffect(() => {
  let mounted = true
  ;(async () => {
   try{
    const data = await getNews()
    if(!mounted) return
    const items = Array.isArray(data) ? data : []
    const mapped: NewsCard[] = items.map((n: unknown) => {
      const obj = (typeof n === "object" && n) ? (n as Record<string, unknown>) : {}
      const title = String(obj.title || "")
      const source = String(obj.source || "")
      const timestamp = typeof obj.timestamp === "string" ? obj.timestamp : ""
      return {
        title,
        source,
        time: timeAgo(timestamp),
        sentiment: guessSentiment(title),
        image: imageFor(`${source || "news"}-${title || ""}`, 800, 400),
        _thumb: imageFor(`${source || "news"}-${title || ""}`, 100, 100),
      }
    })
    setNews(mapped.slice(0, 6))
    setHeadlines(mapped.slice(0, 8).map((x) => ({ text: x.title, time: x.time, source: x.source, image: x._thumb })))
   }catch(_e){
    // keep empty; UI will still render without breaking
   }
  })()
  return () => { mounted = false }
 }, [])

 const [index,setIndex] = useState(0)

 function next(){
  if(news.length) setIndex((index+1)%news.length)
 }

 function prev(){
  if(news.length) setIndex((index-1+news.length)%news.length)
 }

  return(

  <Panel title="Market News">

      {/* HERO CAROUSEL - Bigger image */}
   <div className="relative mb-2">
    <AnimatePresence mode="wait">
     <motion.div
      key={news.length ? index : -1}
      initial={{ opacity: 0, x: 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="relative rounded-lg overflow-hidden"
     >
      {news.length ? (
        <img
         src={news[index].image}
         className="w-full h-[280px] object-cover"
        />
      ) : (
        <div className="w-full h-[280px] bg-white/5" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {/* Sentiment badge */}
      {news.length ? (
        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-medium ${
          news[index].sentiment === 'bullish' ? 'bg-green-500/20 text-green-400' :
          news[index].sentiment === 'bearish' ? 'bg-red-500/20 text-red-400' :
          'bg-yellow-500/20 text-yellow-400'
        }`}>
          {news[index].sentiment.toUpperCase()}
        </div>
      ) : null}

      <div className="absolute bottom-0 left-0 right-0 p-3">
       <h3 className="text-sm font-medium text-gray-200 leading-snug">
        {news.length ? news[index].title : "Loading news…"}
       </h3>
       <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-300">
        <span>{news.length ? news[index].source : ""}</span>
        <span className="flex items-center gap-1">
         <Clock className="w-2.5 h-2.5" />
         {news.length ? news[index].time : ""}
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

