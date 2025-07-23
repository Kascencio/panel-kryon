"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import SessionTherapies, {
  sessionTherapies,
  type Therapy,
} from "@/components/session-therapies"
import ColorTherapies from "@/components/color-therapies"
import MoreTherapies from "@/components/more-therapies"

interface Props {
  onStartTherapy: (
    therapy: Therapy,
    dur: "corto" | "mediano" | "largo",
  ) => void
}

export default function TherapySelectionScreen({ onStartTherapy }: Props) {
  const defaultTherapy =
    sessionTherapies.find((t) => t.id === "general") || sessionTherapies[0]

  const [selectedTherapy, setSelectedTherapy] =
    useState<Therapy>(defaultTherapy)
  const [selectedDuration, setSelectedDuration] = useState<
    "corto" | "mediano" | "largo"
  >("corto")

  const handleStart = (therapy: Therapy) =>
    onStartTherapy(therapy, selectedDuration)

  return (
    <div className="min-h-screen p-6">
      {/* encabezado */}
      <header className="text-center mb-8 space-y-4">
        <div className="flex items-center justify-center gap-4">
          <img
            src="/images/cabina-aq-logo.png"
            alt="Cabina AQ"
            className="h-16 w-16"
          />
          <div>
            <h1 className="text-4xl font-bold text-white">
              Simulador de Cabina AQ
            </h1>
            <p className="text-gray-400">
              Sistema avanzado de terapia de luz y frecuencias
            </p>
          </div>
        </div>

        {/* selector duración */}
        <div className="inline-flex items-center gap-2">
          <span className="text-sm text-gray-300">Duración:</span>
          <Select
            value={selectedDuration}
            onValueChange={(v) =>
              setSelectedDuration(v as "corto" | "mediano" | "largo")
            }
          >
            <SelectTrigger className="w-36 bg-gray-700 border-gray-600 text-white h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600 text-white">
              <SelectItem value="corto">Corto (4&nbsp;min)</SelectItem>
              <SelectItem value="mediano">Mediano (15&nbsp;min)</SelectItem>
              <SelectItem value="largo">Largo (20&nbsp;min)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* pestañas */}
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="session">
          <TabsList className="grid grid-cols-3 bg-gray-800 border-gray-700">
            <TabsTrigger value="session">Sesión</TabsTrigger>
            <TabsTrigger value="color">Color</TabsTrigger>
            <TabsTrigger value="more">Más</TabsTrigger>
          </TabsList>

          <TabsContent value="session" className="mt-6">
            <SessionTherapies
              selectedTherapy={selectedTherapy}
              onTherapySelect={setSelectedTherapy}
              onStartTherapy={handleStart}
            />
          </TabsContent>

          <TabsContent value="color" className="mt-6">
            <ColorTherapies
              selectedTherapy={selectedTherapy}
              onTherapySelect={setSelectedTherapy}
              onStartTherapy={handleStart}
            />
          </TabsContent>

          <TabsContent value="more" className="mt-6">
            <MoreTherapies
              selectedTherapy={selectedTherapy}
              onTherapySelect={setSelectedTherapy}
              onStartTherapy={handleStart}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
