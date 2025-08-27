"use client"

import { useState } from "react"

import SessionTherapies, { sessionTherapies, type Therapy } from "@/components/session-therapies"

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

      {/* Terapias disponibles */}
      <div className="max-w-7xl mx-auto mt-6">
        <SessionTherapies
          selectedTherapy={selectedTherapy}
          onTherapySelect={handleTherapySelect}
          onStartTherapy={handleStart}
        />
      </div>
    </div>
  )
}
