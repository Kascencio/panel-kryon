"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Clock, Zap } from "lucide-react"
import SessionTherapies, { sessionTherapies } from "@/components/session-therapies"
import ColorTherapies from "@/components/color-therapies"
import MoreTherapies from "@/components/more-therapies"
import ArduinoConnection from "@/components/arduino-connection"
import AudioPreloader from "@/components/audio-preloader"
import AudioPlayer from "@/components/audio-player"

interface Therapy {
  id: string
  name: string
  description: string
  frequency: string
  color: string
  icon: string
  category: string
  hasVideo?: boolean
}

interface TherapySelectionScreenProps {
  onStartTherapy: (therapy: Therapy, duration: "corto" | "mediano" | "largo") => void
}

export default function TherapySelectionScreen({ onStartTherapy }: TherapySelectionScreenProps) {
  // Seleccionar la terapia "general" por defecto
  const defaultTherapy = sessionTherapies.find((t) => t.id === "general") || sessionTherapies[0]
  const [selectedTherapy, setSelectedTherapy] = useState<Therapy>(defaultTherapy)
  const [selectedDuration, setSelectedDuration] = useState<"corto" | "mediano" | "largo">("corto")

  const handleTherapySelect = (therapy: Therapy) => {
    setSelectedTherapy(therapy)
  }

  const handleStartSession = () => {
    if (selectedTherapy) {
      onStartTherapy(selectedTherapy, selectedDuration)
    }
  }

  const getDurationInMinutes = (duration: "corto" | "mediano" | "largo") => {
    switch (duration) {
      case "corto":
        return 4
      case "mediano":
        return 15
      case "largo":
        return 20
      default:
        return 4
    }
  }

  const getAudioPath = () => {
    if (!selectedTherapy) return ""
    const durationSuffix = `${getDurationInMinutes(selectedDuration)}min`
    return `/audio/${selectedTherapy.frequency}-${durationSuffix}.mp3`
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <img src="/images/cabina-aq-logo.png" alt="Cabina AQ" className="h-16 w-16" />
          <div>
            <h1 className="text-4xl font-bold text-white">Simulador de Cabina AQ</h1>
            <p className="text-gray-400 mt-2">Sistema avanzado de terapia de luz y frecuencias</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel principal de terapias */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="session" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
              <TabsTrigger value="session" className="data-[state=active]:bg-gray-700 text-white">
                Sesión
              </TabsTrigger>
              <TabsTrigger value="color" className="data-[state=active]:bg-gray-700 text-white">
                Color
              </TabsTrigger>
              <TabsTrigger value="more" className="data-[state=active]:bg-gray-700 text-white">
                Más
              </TabsTrigger>
            </TabsList>

            <TabsContent value="session" className="mt-6">
              <SessionTherapies onTherapySelect={handleTherapySelect} selectedTherapy={selectedTherapy} />
            </TabsContent>

            <TabsContent value="color" className="mt-6">
              <ColorTherapies onTherapySelect={handleTherapySelect} selectedTherapy={selectedTherapy} />
            </TabsContent>

            <TabsContent value="more" className="mt-6">
              <MoreTherapies onTherapySelect={handleTherapySelect} selectedTherapy={selectedTherapy} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Panel lateral de control */}
        <div className="space-y-4">
          {/* Precargador de audio */}
          <AudioPreloader />

          {/* Control de sesión */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center">
                <Zap className="mr-2 h-5 w-5 text-cyan-400" />
                Control de Sesión
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Terapia seleccionada */}
              <div className="p-3 bg-gray-700/50 rounded-md border border-gray-600">
                <div className="flex items-center space-x-3 mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: selectedTherapy.color }}
                  >
                    {selectedTherapy.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">{selectedTherapy.name}</h3>
                    <Badge
                      className="text-xs mt-1"
                      style={{
                        backgroundColor: `${selectedTherapy.color}20`,
                        color: selectedTherapy.color,
                        border: `1px solid ${selectedTherapy.color}40`,
                      }}
                    >
                      {selectedTherapy.frequency}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Selector de duración */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Duración de la sesión
                </label>
                <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                  <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600 text-white">
                    <SelectItem value="corto">Corto (4 minutos)</SelectItem>
                    <SelectItem value="mediano">Mediano (15 minutos)</SelectItem>
                    <SelectItem value="largo">Largo (20 minutos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botón de inicio */}
              <Button
                onClick={handleStartSession}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-medium py-3"
                style={{ backgroundColor: selectedTherapy.color }}
              >
                <Play className="mr-2 h-4 w-4" />
                Iniciar {selectedTherapy.name} ({getDurationInMinutes(selectedDuration)} min)
              </Button>
            </CardContent>
          </Card>

          {/* Reproductor de audio de prueba */}
          <AudioPlayer
            src={getAudioPath()}
            className="w-full"
            onTimeUpdate={(current, duration) => {
              // Opcional: manejar actualizaciones de tiempo
            }}
          />

          {/* Conexión Arduino */}
          <ArduinoConnection />
        </div>
      </div>
    </div>
  )
}
