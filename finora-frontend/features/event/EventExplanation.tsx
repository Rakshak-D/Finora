"use client"

import Panel from "../../components/Panel"
import { motion } from "framer-motion"

export default function EventExplanation(){

 const explanations = [
  "Interest rate hikes reduce liquidity in equity markets.",
  "Higher interest rates increase demand for safe-haven assets like gold.",
  "Energy supply disruptions can push oil prices higher.",
  "Rising oil prices increase operating costs for airline companies."
 ]

 return(

  <Panel title="Impact Explanation">

    <div className="space-y-2">

      {explanations.map((item,index)=>(

        <motion.p 
          key={index}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="text-xs text-gray-300"
        >
          • {item}
        </motion.p>

      ))}

    </div>

  </Panel>

 )

}
