"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play } from "lucide-react"

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

interface ColorTherapiesProps {
  selectedTherapy: Therapy | null
  onTherapySelect: (therapy: Therapy) => void
  onStartTherapy: (therapy: Therapy) => void
}

const colorTherapies: Therapy[] = [
  { id: "red",    name: "Rojo",        description: "Luz roja energizante",        frequency: "rojo",    color: "#ef4444", icon: "🔴", category: "color" },
  { id: "green",  name: "Verde",       description: "Luz verde equilibrante",      frequency: "verde",  color: "#22c55e", icon: "🟢", category: "color" },
  { id: "blue",   name: "Azul",        description: "Luz azul relajante",         frequency: "azul",   color: "#3b82f6", icon: "🔵", category: "color" },
  { id: "yellow", name: "Amarillo",    description: "Luz amarilla estimulante",    frequency: "amarillo",color: "#eab308", icon: "🟡", category: "color" },
  { id: "purple", name: "Púrpura",     description: "Luz púrpura meditativa",      frequency: "purpura", color: "#a855f7", icon: "🟣", category: "color" },
  { id: "orange", name: "Naranja",     description: "Luz naranja revitalizante",  frequency: "naranja", color: "#f97316", icon: "🟠", category: "color" },
]

export default function ColorTherapies({ selectedTherapy, onTherapySelect, onStartTherapy }: ColorTherapiesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {colorTherapies.map((therapy) => {
        const isSelected = selectedTherapy?.id === therapy.id
        return (
          <Card
            key={therapy.id}
            className={`bg-gray-800 border-gray-700 hover:border-gray-600 cursor-pointer transition-all ${isSelected ? "ring-2 ring-purple-500 border-purple-500" : ""}`}
            onClick={() => onTherapySelect(therapy)}
          >
            <CardContent className="p-4 space-y-4 text-center">
              {/* Icono */}
              <div
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${therapy.color}20`, color: therapy.color }}
              >
                {therapy.icon}
              </div>
              {/* Nombre */}
              <h3 className="text-white font-semibold text-lg">{therapy.name}</h3>
              {/* Badge frecuencia */}
              <Badge
                className="text-xs"
                style={{ backgroundColor: `${therapy.color}20`, color: therapy.color, border: `1px solid ${therapy.color}40` }}
              >
                {therapy.frequency}
              </Badge>
              {/* Botón iniciar */}
              <Button
                size="sm"
                className="w-full bg-green-600 hover:bg-green-500 text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  onStartTherapy(therapy)
                }}
              >
                <Play className="h-3 w-3 mr-1" /> Iniciar
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
