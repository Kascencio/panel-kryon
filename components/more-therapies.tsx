"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Settings } from "lucide-react"

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

interface MoreTherapiesProps {
  onTherapySelect: (therapy: Therapy) => void
  selectedTherapy: Therapy | null
}

export const therapies: Therapy[] = [
  {
    id: "relax",
    name: "Relajación",
    description: "Terapia para relajación profunda",
    frequency: "pausado",
    color: "#06b6d4",
    icon: "🧘",
    category: "wellness",
  },
  {
    id: "energy",
    name: "Energía",
    description: "Terapia para aumentar energía",
    frequency: "intermitente",
    color: "#f59e0b",
    icon: "⚡",
    category: "wellness",
  },
  {
    id: "balance",
    name: "Equilibrio",
    description: "Terapia para equilibrio mental",
    frequency: "cascada",
    color: "#10b981",
    icon: "⚖️",
    category: "wellness",
  },
  {
    id: "focus",
    name: "Concentración",
    description: "Terapia para mejorar concentración",
    frequency: "general",
    color: "#8b5cf6",
    icon: "🎯",
    category: "cognitive",
  },
  {
    id: "sleep",
    name: "Sueño",
    description: "Terapia para mejorar el sueño",
    frequency: "pausado",
    color: "#6366f1",
    icon: "😴",
    category: "wellness",
  },
  {
    id: "meditation",
    name: "Meditación",
    description: "Terapia para meditación profunda",
    frequency: "cascada",
    color: "#ec4899",
    icon: "🕉️",
    category: "spiritual",
  },
  {
    id: "creativity",
    name: "Creatividad",
    description: "Terapia para estimular creatividad",
    frequency: "intermitente",
    color: "#f97316",
    icon: "🎨",
    category: "cognitive",
  },
  {
    id: "healing",
    name: "Sanación",
    description: "Terapia para proceso de sanación",
    frequency: "general",
    color: "#84cc16",
    icon: "💚",
    category: "healing",
  },
]

export default function MoreTherapies({ onTherapySelect, selectedTherapy }: MoreTherapiesProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Más Terapias</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {therapies.map((therapy) => (
          <Card
            key={therapy.id}
            className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
              selectedTherapy?.id === therapy.id
                ? "bg-gray-700 border-green-400 shadow-lg shadow-green-400/20"
                : "bg-gray-800 border-gray-700 hover:border-gray-600"
            }`}
          >
            <CardContent className="p-4 text-center space-y-3">
              {/* Icono y nombre */}
              <div className="space-y-2">
                <div
                  className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white text-xl"
                  style={{ backgroundColor: therapy.color }}
                >
                  {therapy.icon}
                </div>
                <h3 className="font-medium text-white text-sm">{therapy.name}</h3>
              </div>

              {/* Badge de frecuencia */}
              <Badge
                className="text-xs"
                style={{
                  backgroundColor: `${therapy.color}20`,
                  color: therapy.color,
                  border: `1px solid ${therapy.color}40`,
                }}
              >
                {therapy.frequency}
              </Badge>

              {/* Badge de categoría */}
              <Badge className="bg-gray-700/50 text-gray-300 text-xs capitalize">{therapy.category}</Badge>

              {/* Botones */}
              <div className="space-y-2">
                <Button
                  size="sm"
                  onClick={() => onTherapySelect(therapy)}
                  className={`w-full text-xs ${
                    selectedTherapy?.id === therapy.id
                      ? "bg-green-600 hover:bg-green-500 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  }`}
                  style={{
                    backgroundColor: selectedTherapy?.id === therapy.id ? therapy.color : undefined,
                  }}
                >
                  <Play className="h-3 w-3 mr-1" />
                  {selectedTherapy?.id === therapy.id ? "Seleccionada" : "Iniciar"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 text-xs bg-transparent"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Personalizar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
