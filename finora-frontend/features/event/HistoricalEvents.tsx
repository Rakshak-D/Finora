"use client"

import Panel from "../../components/Panel"
import { motion } from "framer-motion"

export default function HistoricalEvents() {

  const events = [
    {
      title: "Russia–Ukraine War (2022)",
      impact: "Oil prices surged, energy stocks gained"
    },
    {
      title: "OPEC Production Cuts (2016)",
      impact: "Crude oil increased, airline stocks dropped"
    },
    {
      title: "Global Financial Crisis (2008)",
      impact: "Stock markets crashed, gold surged"
    }
  ]

  return (

    <Panel title="Similar Historical Events">

      <div>

        {events.map((event, i) => (

          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            style={{
              background:"#141A2A",
              padding:"12px",
              borderRadius:"8px",
              marginTop:"8px"
            }}
          >

            <h4 className="text-sm text-white">{event.title}</h4>

            <p className="text-xs text-gray-400 mt-1">
              {event.impact}
            </p>

          </motion.div>

        ))}

      </div>

    </Panel>

  )

}
