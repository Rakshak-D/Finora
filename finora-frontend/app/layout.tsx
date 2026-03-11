import "./globals.css"
import { Inter, Space_Grotesk, JetBrains_Mono, Orbitron, Rajdhani } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
})

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk"
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
})

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron"
})

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani"
})

export const metadata = {
  title: "Finora - AI Market Intelligence",
  description: "AI-powered market intelligence platform with FinBERT, BART, and Gemini"
}

export default function RootLayout({children}:{children:React.ReactNode}){

 return(

  <html lang="en">

   <body className={`${inter.variable} ${grotesk.variable} ${mono.variable} ${orbitron.variable} ${rajdhani.variable}`}>

     {children}

   </body>

  </html>

 )

}

