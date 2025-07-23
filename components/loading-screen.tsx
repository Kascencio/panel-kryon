"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0)
  const [loadingText, setLoadingText] = useState("Iniciando sistema...")
  const [showLogo, setShowLogo] = useState(true)

  const loadingSteps = [
    { progress: 20, text: "Iniciando sistema..." },
    { progress: 40, text: "Cargando terapias..." },
    { progress: 60, text: "Configurando audio..." },
    { progress: 80, text: "Preparando interfaz..." },
    { progress: 95, text: "Finalizando carga..." },
    { progress: 100, text: "¡Listo!" },
  ]

  useEffect(() => {
    let currentStep = 0
    const interval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep]
        setProgress(step.progress)
        setLoadingText(step.text)
        currentStep++
      } else {
        clearInterval(interval)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">
      {/* Efectos de fondo */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 text-center space-y-8 px-8">
        {/* Logo animado */}
        <AnimatePresence>
          {showLogo && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              <motion.div
                className="w-32 h-32 mx-auto bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl"
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                <div className="text-white text-3xl font-bold">CA</div>
              </motion.div>

              {/* Anillos orbitales */}
              <motion.div
                className="absolute inset-0 border-2 border-cyan-400/30 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                style={{ width: "140px", height: "140px", margin: "-4px" }}
              />
              <motion.div
                className="absolute inset-0 border border-blue-400/20 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                style={{ width: "160px", height: "160px", margin: "-14px" }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Título y descripción */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="space-y-4"
        >
          <h1 className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Cabina AQ
          </h1>
          <p className="text-gray-300 text-xl">Sistema Avanzado de Terapia Lumínica</p>
          <p className="text-gray-400 text-sm">Versión 2.0 - Tecnología de Bienestar</p>
        </motion.div>

        {/* Barra de progreso mejorada */}
        <motion.div
          className="w-80 mx-auto space-y-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <div className="relative">
            <div className="w-full bg-gray-700/50 rounded-full h-3 backdrop-blur-sm border border-gray-600/30">
              <motion.div
                className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 h-3 rounded-full relative overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {/* Efecto de brillo */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                />
              </motion.div>
            </div>

            {/* Porcentaje */}
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-400">{loadingText}</span>
              <span className="text-sm font-mono text-cyan-400">{Math.round(progress)}%</span>
            </div>
          </div>
        </motion.div>

        {/* Indicadores de estado */}
        <motion.div
          className="flex justify-center space-x-6 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <div className="flex items-center space-x-2">
            <motion.div
              className="w-2 h-2 bg-green-400 rounded-full"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            />
            <span className="text-gray-400">Sistema</span>
          </div>
          <div className="flex items-center space-x-2">
            <motion.div
              className="w-2 h-2 bg-blue-400 rounded-full"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
            />
            <span className="text-gray-400">Audio</span>
          </div>
          <div className="flex items-center space-x-2">
            <motion.div
              className="w-2 h-2 bg-purple-400 rounded-full"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
            />
            <span className="text-gray-400">Terapias</span>
          </div>
        </motion.div>

        {/* Puntos de carga animados */}
        <motion.div
          className="flex justify-center space-x-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>

        {/* Mensaje final */}
        {progress === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-2"
          >
            <div className="text-2xl">✨</div>
            <p className="text-green-400 font-semibold">Sistema listo para usar</p>
          </motion.div>
        )}
      </div>

      {/* Partículas flotantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: window.innerHeight + 10,
            }}
            animate={{
              y: -10,
              x: Math.random() * window.innerWidth,
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 5,
              ease: "linear",
            }}
          />
        ))}
      </div>
    </div>
  )
}
