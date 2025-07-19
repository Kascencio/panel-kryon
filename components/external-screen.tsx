"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Monitor,
  Tv,
  Smartphone,
  Laptop,
  ExternalLink,
  X,
  Minimize,
  Maximize,
  Cast,
  Pin,
  PinOff,
  Play,
  Pause,
  Volume2,
  VolumeX,
  LayoutGrid,
  Info,
  Eye,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Move,
  RotateCcw,
  Video,
  Music,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import type { ScreenType } from "@/components/screen-selector"

// Asegurar que solo se usen los colores exactos del Arduino
const ARDUINO_COLORS = {
  rojo: "#ff0000",
  verde: "#00ff00",
  azul: "#0000ff",
}

interface ExternalScreenProps {
  screenType: ScreenType
  doorOpen: boolean
  sessionActive: boolean
  sessionType: string
  therapyColor: string | null
  sessionDuration: number
  lightIntensity: number
  onClose: () => void
  onStartSession?: () => void
  onStopSession?: () => void
  selectedTherapy: any | null
  isPrimary: boolean
  onSetPrimary: () => void
  position?: { x: number; y: number } | null
  onPositionChange?: (position: { x: number; y: number }) => void
  hasVideo?: boolean
  videoSource?: string
  mediaType?: "audio" | "video"
}

export default function ExternalScreen({
  screenType,
  doorOpen,
  sessionActive,
  sessionType,
  therapyColor,
  sessionDuration,
  lightIntensity,
  onClose,
  onStartSession,
  onStopSession,
  selectedTherapy,
  isPrimary,
  onSetPrimary,
  position,
  onPositionChange,
  hasVideo = false,
  videoSource = "",
  mediaType = "audio",
}: ExternalScreenProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [qualityLevel, setQualityLevel] = useState("medium")
  const [volume, setVolume] = useState(70)
  const [muted, setMuted] = useState(false)
  const [activeTab, setActiveTab] = useState("view")
  const [isPinned, setIsPinned] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [screenPosition, setScreenPosition] = useState(position || { x: 0, y: 0 })
  const [showControls, setShowControls] = useState(true)
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null)
  const [showTip, setShowTip] = useState(false)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const screenRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const positionRef = useRef<{ x: number; y: number }>(screenPosition)

  // Actualizar la posición de referencia cuando cambia screenPosition
  useEffect(() => {
    positionRef.current = screenPosition
  }, [screenPosition])

  // Actualizar la posición cuando cambia desde props
  useEffect(() => {
    if (position) {
      setScreenPosition(position)
    }
  }, [position])

  // Mostrar tip al inicio
  useEffect(() => {
    setShowTip(true)
    const timer = setTimeout(() => {
      setShowTip(false)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  // Auto-ocultar controles después de un tiempo
  useEffect(() => {
    if (showControls && !isDragging) {
      if (controlsTimeout) clearTimeout(controlsTimeout)
      const timeout = setTimeout(() => {
        setShowControls(false)
      }, 5000)
      setControlsTimeout(timeout)
    }
    return () => {
      if (controlsTimeout) clearTimeout(controlsTimeout)
    }
  }, [showControls, isDragging])

  // Configuración de calidad para Three.js
  const getPixelRatio = () => {
    if (qualityLevel === "low") return Math.min(window.devicePixelRatio, 1)
    if (qualityLevel === "medium") return Math.min(window.devicePixelRatio, 1.5)
    return window.devicePixelRatio // high
  }

  // Manejar el cambio de pantalla completa
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (screenRef.current) {
        screenRef.current.requestFullscreen().catch((err) => {
          console.error(`Error al intentar mostrar en pantalla completa: ${err.message}`)
        })
      }
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  // Detectar cambios en el estado de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  // Obtener el icono y nombre de la pantalla actual
  const getScreenInfo = () => {
    switch (screenType) {
      case "monitor":
        return {
          icon: <ExternalLink className="h-4 w-4 mr-1" />,
          name: "Monitor Externo",
          color: "#3b82f6", // Azul
        }
      case "tv":
        return {
          icon: <Tv className="h-4 w-4 mr-1" />,
          name: "Televisión",
          color: "#ef4444", // Rojo
        }
      case "mobile":
        return {
          icon: <Smartphone className="h-4 w-4 mr-1" />,
          name: "Dispositivo Móvil",
          color: "#10b981", // Verde
        }
      case "laptop":
        return {
          icon: <Laptop className="h-4 w-4 mr-1" />,
          name: "Laptop",
          color: "#f59e0b", // Ámbar
        }
      case "presentation":
        return {
          icon: <Cast className="h-4 w-4 mr-1" />,
          name: "Modo Presentación",
          color: "#8b5cf6", // Púrpura
        }
      default:
        return {
          icon: <Monitor className="h-4 w-4 mr-1" />,
          name: "Pantalla Principal",
          color: "#0891b2", // Cyan
        }
    }
  }

  const { icon, name, color } = getScreenInfo()

  // Estilos específicos según el tipo de pantalla
  const getScreenStyles = () => {
    switch (screenType) {
      case "tv":
        return {
          container: "rounded-lg border-8 border-black bg-black",
          header: "bg-black text-white",
          accent: color,
        }
      case "mobile":
        return {
          container: "rounded-3xl border-8 border-gray-800 bg-black",
          header: "bg-gray-900 text-white",
          accent: color,
        }
      case "laptop":
        return {
          container: "rounded-md border-4 border-gray-700 bg-gray-800",
          header: "bg-gray-800 text-white",
          accent: color,
        }
      case "presentation":
        return {
          container: "rounded-none border-0 bg-black",
          header: "bg-black text-white",
          accent: color,
        }
      case "monitor":
      default:
        return {
          container: "rounded-md border-2 border-gray-700 bg-gray-900",
          header: "bg-gray-800 text-white",
          accent: color,
        }
    }
  }

  const screenStyles = getScreenStyles()

  // Función para iniciar el arrastre
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPinned || isFullscreen) return

    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    }
  }

  // Función para manejar el movimiento durante el arrastre
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return

    const newX = e.clientX - dragStartRef.current.x
    const newY = e.clientY - dragStartRef.current.y

    setScreenPosition({ x: newX, y: newY })

    if (onPositionChange) {
      onPositionChange({ x: newX, y: newY })
    }
  }

  // Función para finalizar el arrastre
  const handleMouseUp = () => {
    setIsDragging(false)
    dragStartRef.current = null
  }

  // Configurar los event listeners para el arrastre
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  // Determinar el estilo de posición
  const getPositionStyle = () => {
    if (isFullscreen) return {}

    return {
      position: "fixed",
      top: 0,
      left: 0,
      transform: `translate(${screenPosition.x}px, ${screenPosition.y}px)`,
      zIndex: isPrimary ? 51 : 50,
      transition: isDragging ? "none" : "box-shadow 0.3s ease",
    } as React.CSSProperties
  }

  // Resetear la posición de la pantalla
  const resetPosition = () => {
    const newPosition = { x: 100, y: 100 }
    setScreenPosition(newPosition)
    if (onPositionChange) {
      onPositionChange(newPosition)
    }
  }

  // Mostrar controles y reiniciar temporizador
  const handleShowControls = () => {
    setShowControls(true)
    if (controlsTimeout) {
      clearTimeout(controlsTimeout)
      setControlsTimeout(null)
    }
  }

  // Manejar video cuando hay terapia con video
  useEffect(() => {
    if (hasVideo && mediaType === "video" && videoSource && videoRef.current) {
      videoRef.current.src = videoSource
      videoRef.current.volume = muted ? 0 : volume / 100
      videoRef.current.muted = muted

      if (sessionActive) {
        videoRef.current.play().catch(console.error)
        setVideoPlaying(true)
      } else {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
        setVideoPlaying(false)
      }
    }
  }, [hasVideo, mediaType, videoSource, sessionActive, volume, muted])

  // Controlar video según el estado de la sesión
  useEffect(() => {
    if (videoRef.current && hasVideo && mediaType === "video") {
      if (sessionActive && !videoPlaying) {
        videoRef.current.play().catch(console.error)
        setVideoPlaying(true)
      } else if (!sessionActive && videoPlaying) {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
        setVideoPlaying(false)
      }
    }
  }, [sessionActive, hasVideo, mediaType, videoPlaying])

  // Función para alternar reproducción de video
  const toggleVideoPlayback = () => {
    if (videoRef.current && hasVideo && mediaType === "video") {
      if (videoPlaying) {
        videoRef.current.pause()
        setVideoPlaying(false)
      } else {
        videoRef.current.play().catch(console.error)
        setVideoPlaying(true)
      }
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={screenRef}
        className={`${isFullscreen ? "fixed inset-0" : "fixed"} z-50 ${
          isPinned && !isFullscreen ? "pointer-events-none" : ""
        }`}
        style={getPositionStyle()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: 1,
          boxShadow: isPrimary ? "0 0 0 3px rgba(8, 145, 178, 0.5)" : "none",
        }}
        exit={{ opacity: 0, scale: 0.9 }}
        onMouseEnter={handleShowControls}
        onMouseMove={handleShowControls}
      >
        <div
          className={`${
            isFullscreen
              ? "w-full h-full"
              : screenType === "mobile"
                ? "w-[320px] h-[640px]"
                : screenType === "presentation"
                  ? "w-[800px] h-[600px]"
                  : "w-[640px] h-[480px]"
          } flex flex-col overflow-hidden ${screenStyles.container} ${
            isPrimary && !isFullscreen ? "ring-2 ring-cyan-500" : ""
          } ${isDragging ? "cursor-grabbing" : "cursor-grab"} ${
            isPinned && !isFullscreen ? "opacity-70 hover:opacity-100 transition-opacity" : ""
          } shadow-xl`}
        >
          {/* Barra de título */}
          <div
            className={`flex items-center justify-between p-2 ${screenStyles.header} bg-gradient-to-r from-gray-900 to-gray-800`}
            onMouseDown={handleMouseDown}
            style={{ cursor: isPinned || isFullscreen ? "default" : "grab" }}
          >
            <div className="flex items-center">
              <div
                className="p-1 rounded-full mr-1"
                style={{ backgroundColor: `${screenStyles.accent}20`, color: screenStyles.accent }}
              >
                {icon}
              </div>
              <span className="ml-1 font-medium text-sm">{name}</span>
              {isPrimary && <Badge className="ml-2 bg-cyan-600/80 text-white text-xs px-1.5 py-0">Principal</Badge>}
              {sessionActive && (
                <Badge className="ml-2 bg-green-600/80 text-white text-xs px-1.5 py-0 animate-pulse">Activa</Badge>
              )}
              {hasVideo && mediaType === "video" && (
                <Badge className="ml-2 bg-purple-600/80 text-white text-xs px-1.5 py-0">
                  <Video className="mr-1 h-3 w-3" />
                  Video
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full hover:bg-gray-700/80 text-gray-400 hover:text-white"
                      onClick={() => setIsPinned(!isPinned)}
                    >
                      {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{isPinned ? "Desanclar ventana" : "Anclar ventana"}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full hover:bg-gray-700/80 text-gray-400 hover:text-white"
                      onClick={toggleFullscreen}
                    >
                      {isFullscreen ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}</p>
                  </TooltipContent>
                </Tooltip>

                {!isPrimary && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full hover:bg-gray-700/80 text-gray-400 hover:text-white"
                        onClick={onSetPrimary}
                      >
                        <LayoutGrid className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Establecer como principal</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full hover:bg-gray-700/80 text-gray-400 hover:text-white"
                  onClick={onClose}
                >
                  <X className="h-3 w-3" />
                </Button>
              </TooltipProvider>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 relative">
            {/* Video para terapias con video */}
            {hasVideo && mediaType === "video" ? (
              <div className="w-full h-full bg-black relative">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  loop
                  playsInline
                  crossOrigin="anonymous"
                  muted={false}
                  controls={false}
                  style={{ outline: "none" }}
                />

                {/* Indicador de estado minimalista */}
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
                  <div className="flex items-center gap-2 text-white text-sm">
                    <div
                      className={`w-2 h-2 rounded-full ${videoPlaying ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}
                    ></div>
                    <span>{videoPlaying ? "Reproduciendo" : "Pausado"}</span>
                  </div>
                </div>

                {/* Solo mostrar controles de volumen si es necesario */}
                {!muted && volume < 50 && (
                  <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-white text-sm">
                      <Volume2 className="h-4 w-4" />
                      <span>{volume}%</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Pantalla negra para terapias sin video o solo audio */
              <div className="w-full h-full bg-black flex items-center justify-center">
                <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Music className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl text-white mb-2">Modo Solo Audio</h3>
                  <p className="text-gray-400">
                    {sessionActive ? "Reproduciendo audio en la pantalla principal" : "Audio en espera"}
                  </p>
                  {selectedTherapy?.name && <p className="text-sm text-gray-500 mt-2">{selectedTherapy.name}</p>}
                </motion.div>
              </div>
            )}

            {/* Panel lateral de controles */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  className="absolute top-0 right-0 h-full"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                >
                  <div className="h-full flex">
                    {/* Botón para mostrar/ocultar panel */}
                    <div className="flex flex-col justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-20 w-6 rounded-l-md bg-gray-900/80 backdrop-blur-sm border-l border-y border-gray-700/50 hover:bg-gray-800/80"
                        onClick={() => setShowControls(false)}
                      >
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>

                    {/* Panel de controles */}
                    <div className="w-64 h-full bg-gray-900/90 backdrop-blur-md border-l border-gray-700/50 flex flex-col">
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                        <TabsList className="px-2 pt-2 bg-transparent border-b border-gray-800/50 justify-start gap-1">
                          <TabsTrigger
                            value="view"
                            className="h-8 data-[state=active]:bg-gray-800/80 data-[state=active]:text-cyan-400"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Vista
                          </TabsTrigger>
                          <TabsTrigger
                            value="controls"
                            className="h-8 data-[state=active]:bg-gray-800/80 data-[state=active]:text-cyan-400"
                          >
                            <Sliders className="h-4 w-4 mr-1" />
                            Control
                          </TabsTrigger>
                          <TabsTrigger
                            value="info"
                            className="h-8 data-[state=active]:bg-gray-800/80 data-[state=active]:text-cyan-400"
                          >
                            <Info className="h-4 w-4 mr-1" />
                            Info
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="view" className="flex-1 p-3 m-0 overflow-auto">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-white text-sm font-medium mb-2 flex items-center">
                                <Eye className="h-4 w-4 mr-1 text-cyan-400" />
                                Visualización
                              </h3>
                              <div className="space-y-3">
                                {/* Solo mostrar control de volumen para video */}
                                {hasVideo && mediaType === "video" && (
                                  <div className="space-y-1">
                                    <label className="text-xs text-gray-400 flex items-center">
                                      <Volume2 className="h-3 w-3 mr-1" />
                                      Volumen
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-gray-400 hover:text-white hover:bg-gray-700/80"
                                        onClick={() => setMuted(!muted)}
                                      >
                                        {muted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                      </Button>

                                      <Slider
                                        value={[volume]}
                                        min={0}
                                        max={100}
                                        step={1}
                                        onValueChange={(value) => {
                                          setVolume(value[0])
                                          if (value[0] === 0) {
                                            setMuted(true)
                                          } else if (muted) {
                                            setMuted(false)
                                          }
                                        }}
                                        className="flex-1 [&>span:first-child]:h-1 [&>span:first-child]:bg-gray-700/80 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-0 [&_[role=slider]]:bg-cyan-500"
                                      />

                                      <span className="text-xs text-gray-400 w-8 text-right">{volume}%</span>
                                    </div>
                                  </div>
                                )}

                                {/* Calidad de renderizado solo para contenido 3D */}
                                {(!hasVideo || mediaType === "audio") && (
                                  <div className="space-y-1">
                                    <label className="text-xs text-gray-400">Calidad 3D</label>
                                    <div className="flex gap-2">
                                      {["low", "medium", "high"].map((quality) => (
                                        <Button
                                          key={quality}
                                          variant="outline"
                                          size="sm"
                                          className={`text-xs flex-1 ${
                                            qualityLevel === quality
                                              ? "bg-gray-700/80 border-gray-600/80 text-cyan-400"
                                              : "bg-gray-800/60 border-gray-700/60"
                                          }`}
                                          onClick={() => setQualityLevel(quality)}
                                        >
                                          {quality === "low" ? "Baja" : quality === "medium" ? "Media" : "Alta"}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="controls" className="flex-1 p-3 m-0 overflow-auto">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-white text-sm font-medium mb-2 flex items-center">
                                <Sliders className="h-4 w-4 mr-1 text-cyan-400" />
                                Controles de Sesión
                              </h3>
                              <div className="space-y-3">
                                {sessionActive ? (
                                  <Button variant="destructive" size="sm" className="w-full" onClick={onStopSession}>
                                    <Pause className="h-4 w-4 mr-1" />
                                    Detener Sesión
                                  </Button>
                                ) : (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    onClick={onStartSession}
                                  >
                                    <Play className="h-4 w-4 mr-1" />
                                    Iniciar Sesión
                                  </Button>
                                )}

                                {/* Solo mostrar controles de posición si no está anclada */}
                                {!isPinned && !isFullscreen && (
                                  <div className="space-y-1">
                                    <label className="text-xs text-gray-400 flex items-center">
                                      <Move className="h-3 w-3 mr-1" />
                                      Posición
                                    </label>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full text-xs bg-gray-800/60 border-gray-700/60"
                                      onClick={resetPosition}
                                    >
                                      <RotateCcw className="h-3 w-3 mr-1" />
                                      Centrar Ventana
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="info" className="flex-1 p-3 m-0 overflow-auto">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-white text-sm font-medium mb-2 flex items-center">
                                <Info className="h-4 w-4 mr-1 text-cyan-400" />
                                Información
                              </h3>
                              <div className="space-y-3 text-xs">
                                <div className="bg-gray-800/50 rounded p-2 space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Pantalla:</span>
                                    <span className="text-white">{name}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Estado:</span>
                                    <span className={sessionActive ? "text-green-400" : "text-gray-400"}>
                                      {sessionActive ? "Activa" : "Inactiva"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Duración:</span>
                                    <span className="text-white">{sessionDuration} min</span>
                                  </div>
                                  {selectedTherapy && (
                                    <>
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Terapia:</span>
                                        <span className="text-white">{selectedTherapy.name}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-400">Tipo:</span>
                                        <span className="text-white flex items-center">
                                          {hasVideo && mediaType === "video" ? (
                                            <>
                                              <Video className="h-3 w-3 mr-1" />
                                              Video
                                            </>
                                          ) : (
                                            <>
                                              <Music className="h-3 w-3 mr-1" />
                                              Audio
                                            </>
                                          )}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                  {therapyColor && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-400">Color:</span>
                                      <div className="flex items-center">
                                        <div
                                          className="w-3 h-3 rounded-full mr-1 border border-gray-600"
                                          style={{
                                            backgroundColor:
                                              ARDUINO_COLORS[therapyColor as keyof typeof ARDUINO_COLORS] ||
                                              therapyColor,
                                          }}
                                        />
                                        <span className="text-white capitalize">{therapyColor}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="bg-gray-800/50 rounded p-2 space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Calidad:</span>
                                    <span className="text-white capitalize">{qualityLevel}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Volumen:</span>
                                    <span className="text-white">{volume}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Anclada:</span>
                                    <span className={isPinned ? "text-green-400" : "text-gray-400"}>
                                      {isPinned ? "Sí" : "No"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botón para mostrar controles cuando están ocultos */}
            {!showControls && (
              <div className="absolute top-1/2 right-0 transform -translate-y-1/2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-20 w-6 rounded-r-none bg-gray-900/80 backdrop-blur-sm border-r border-y border-gray-700/50 hover:bg-gray-800/80"
                  onClick={handleShowControls}
                >
                  <ChevronLeft className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            )}

            {/* Tip de ayuda */}
            <AnimatePresence>
              {showTip && !isFullscreen && (
                <motion.div
                  className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 max-w-xs"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex items-start">
                    <Info className="h-4 w-4 text-cyan-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-gray-300">
                      <p className="font-medium text-white mb-1">Pantalla Externa</p>
                      <p>Arrastra para mover, usa los controles laterales para configurar la vista.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
