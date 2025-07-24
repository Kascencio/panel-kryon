"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Atom, Zap, Sparkles, Activity, Waves, Brain, AlertTriangle } from "lucide-react"

interface LoadingScreenProps {
  /** Si se proporciona, la barra adopta ese valor (0-100).  */
  progress?: number
  /** True = muestra estado de error (color rojo). */
  error?: boolean
  /** Duración en ms para el progreso automático. Default 7000 ms. */
  totalDurationMs?: number
}

/* ────────── Mensajes que rotan ────────── */
const loadingMessages = [
  { text: "Calibrando sistema cuántico...",    icon: <Atom      className="h-5 w-5 text-cyan-400 mr-2" /> },
  { text: "Iniciando sistema bioenergético...", icon: <Zap       className="h-5 w-5 text-cyan-400 mr-2" /> },
  { text: "Cargando terapias...",               icon: <Activity  className="h-5 w-5 text-cyan-400 mr-2" /> },
  { text: "Sincronizando frecuencias...",       icon: <Waves     className="h-5 w-5 text-cyan-400 mr-2" /> },
  { text: "Preparando entorno virtual...",      icon: <Sparkles  className="h-5 w-5 text-cyan-400 mr-2" /> },
  { text: "Inicializando simulador...",         icon: <Brain     className="h-5 w-5 text-cyan-400 mr-2" /> },
]

export default function LoadingScreen({ progress, error = false, totalDurationMs = 7000 }: LoadingScreenProps) {
  const controlled = typeof progress === "number"
  const [autoProgress, setAutoProgress] = useState(0)
  const shown = controlled ? progress! : autoProgress

  // mensajes
  const [msgIndex, setMsgIndex] = useState(0)
  const [pulse, setPulse] = useState(false)

  /* Mensaje cada segundo */
  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % loadingMessages.length)
      setPulse(true)
      setTimeout(() => setPulse(false), 300)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  /* Progreso automático ligado a totalDurationMs */
  useEffect(() => {
    if (controlled) return
    const start = performance.now()
    const tick = () => {
      const elapsed = performance.now() - start
      const pct = Math.min((elapsed / totalDurationMs) * 100, 100)
      setAutoProgress(pct)
      if (pct < 100) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [controlled, totalDurationMs])

  /* ────────── UI ────────── */
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <div className="w-full max-w-md px-6 py-8 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 rounded-full border-4 border-cyan-500 relative animate-spin-slow">
            <div className="absolute inset-2 border-2 border-cyan-400 rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Atom className="h-12 w-12 text-cyan-400" />
            </div>
            <div className="absolute -inset-4 bg-cyan-500/10 rounded-full blur-xl" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white mb-2 tracking-wider">CABINA AQ</h1>
        <p className="text-xl text-cyan-400 mb-10">Sistema Cuántico Bioenergético</p>

        {/* Barra de progreso */}
        <div className="w-full mb-6">
          <Progress
            value={shown}
            className="h-2 bg-gray-800"
            indicatorClassName={error ? "bg-red-500" : "bg-gradient-to-r from-cyan-500 to-blue-500"}
          />
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>{error ? "Error" : "Inicializando"}</span>
            <span>{Math.round(shown)}%</span>
          </div>
        </div>

        {/* Mensaje / error */}
        {error ? (
          <div className="flex items-center text-red-400 text-lg mt-4">
            <AlertTriangle className="h-5 w-5 mr-2" /> Error al cargar recursos. Intenta recargar.
          </div>
        ) : (
          <div className={`flex items-center text-white text-lg mt-4 transition-all duration-300 ${pulse ? "scale-105 text-cyan-300" : ""}`}>            
            {loadingMessages[msgIndex].icon}
            {loadingMessages[msgIndex].text}
          </div>
        )}

        {/* Puntos decorativos */}
        <div className="mt-12 flex space-x-6">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" style={{ animationDelay: `${i*0.2}s`, opacity: 0.2 + i*0.15 }} />
          ))}
        </div>

        <div className="absolute bottom-8 text-xs text-gray-600">Versión 2.0 · Sistema Avanzado de Terapia Cuántica</div>
      </div>

      {/* Partículas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 bg-cyan-500 rounded-full" style={{
            top: `${Math.random()*100}%`,
            left: `${Math.random()*100}%`,
            opacity: Math.random()*0.5+0.1,
            animation: `float ${Math.random()*10+10}s linear infinite`,
            animationDelay: `${Math.random()*5}s` }} />
        ))}
      </div>
    </div>
  )
}