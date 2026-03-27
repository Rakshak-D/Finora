import "./globals.css"
import AppProviders from "@/components/shared/AppProviders"

export const metadata = {
  title: "Finora - AI Market Intelligence",
  description: "AI-powered market intelligence platform with FinBERT, BART, and Gemini"
}

export default function RootLayout({children}:{children:React.ReactNode}){

 return(

  <html lang="en">

   <body>
     <AppProviders>{children}</AppProviders>
   </body>

  </html>

 )

}

