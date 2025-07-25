"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SessionTherapies, { sessionTherapies, type Therapy } from "@/components/session-therapies"
import ColorTherapies from "@/components/color-therapies"
import MoreTherapies  from "@/components/more-therapies"

interface Props {
  onStartTherapy: (t: Therapy, d: "corto" | "mediano" | "largo") => void
}

/** Pantalla de selección sin selector global de duración.
 *  La duración se toma de `therapy.sessionDuration` (si existe) o "corto". */
export default function TherapySelectionScreen({ onStartTherapy }: Props) {
  /* terapia por defecto */
  const defaultTherapy = sessionTherapies[0]
  const [selectedTherapy, setSelectedTherapy] = useState<Therapy>(defaultTherapy)

  /* sincroniza terapia seleccionada */
  const handleTherapySelect = (t: Therapy) => setSelectedTherapy(t)

  /* iniciar usando la duración propia de la terapia */
  const handleStart = (t: Therapy) => {
    const dur = t.sessionDuration ?? "corto"
    onStartTherapy(t, dur)
  }

  return (
    <div className="min-h-screen p-6">
      {/* encabezado */}
      <header className="text-center mb-8 space-y-4">
        <div className="flex items-center justify-center gap-4">
          <img src="/images/cabina-aq-logo.png" alt="Cabina AQ" className="h-17 w-16 rounded-md" />
          <div>
            <h1 className="text-4xl font-bold text-white">Cabina AQ</h1>
            <p className="text-gray-400">Sistema avanzado de terapia de luz y frecuencias</p>
          </div>
          <div className="flex items-center justify-center bg-white rounded-full w-24 h-24">
            <img src="/images/logo-aq-cabina.jpeg" alt="Cabina AQ" className="h-14 w-16 rounded-md" />
          </div>
        </div>
      </header>

      {/* tabs */}
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
              onTherapySelect={handleTherapySelect}
              onStartTherapy={handleStart}
            />
          </TabsContent>

          <TabsContent value="color" className="mt-6">
            <ColorTherapies
              selectedTherapy={selectedTherapy}
              onTherapySelect={handleTherapySelect}
              onStartTherapy={handleStart}
            />
          </TabsContent>

          <TabsContent value="more" className="mt-6">
            <MoreTherapies
              selectedTherapy={selectedTherapy}
              onTherapySelect={handleTherapySelect}
              onStartTherapy={handleStart}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
