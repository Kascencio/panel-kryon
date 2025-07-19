import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ScreenProvider } from "@/hooks/ScreenProvider"


const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Simulador de Cabina AQ",
  description: "Sistema avanzado de terapia de luz y frecuencias",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ScreenProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </ScreenProvider>
      </body>
    </html>
  )
}
