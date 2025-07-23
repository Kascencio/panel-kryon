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

interface MoreTherapiesProps {
  selectedTherapy: Therapy | null
  onTherapySelect: (therapy: Therapy) => void
  onStartTherapy: (therapy: Therapy) => void
}

export const therapies: Therapy[] = [
  { id: "relax",      name: "Relajación",   description: "Relajación profunda", frequency: "pausado",       color: "#06b6d4", icon: "🧘", category: "wellness" },
  { id: "energy",     name: "Energía",      description: "Aumento de energía",  frequency: "intermitente", color: "#f59e0b", icon: "⚡",  category: "wellness" },
  { id: "balance",    name: "Equilibrio",   description: "Equilibrio mental",   frequency: "cascada",      color: "#10b981", icon: "⚖️", category: "wellness" },
  { id: "focus",      name: "Concentración",description: "Mejorar enfoque",     frequency: "general",      color: "#8b5cf6", icon: "🎯", category: "cognitive" },
  { id: "sleep",      name: "Sueño",        description: "Mejorar sueño",       frequency: "pausado",       color: "#6366f1", icon: "😴", category: "wellness" },
  { id: "meditation", name: "Meditación",   description: "Meditación profunda", frequency: "cascada",      color: "#ec4899", icon: "🕉️", category: "spiritual" },
  { id: "creativity", name: "Creatividad",  description: "Estimular creatividad",frequency: "intermitente", color: "#f97316", icon: "🎨", category: "cognitive" },
  { id: "healing",    name: "Sanación",     description: "Proceso de sanación", frequency: "general",      color: "#84cc16", icon: "💚", category: "healing" },
]

export default function MoreTherapies({ selectedTherapy, onTherapySelect, onStartTherapy }: MoreTherapiesProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Más Terapias</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {therapies.map((therapy) => {
          const isSelected = selectedTherapy?.id === therapy.id
          return (
            <Card
              key={therapy.id}
              className={`bg-gray-800 border-gray-700 hover:border-gray-600 cursor-pointer transition-all ${isSelected ? "ring-2 ring-green-500 border-green-500" : ""}`}
              onClick={() => onTherapySelect(therapy)}
            >
              <CardContent className="p-4 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: therapy.color }}>
                  {therapy.icon}
                </div>
                <h3 className="text-white font-medium text-sm">{therapy.name}</h3>
                <Badge className="text-xs" style={{ backgroundColor: `${therapy.color}20`, color: therapy.color, border: `1px solid ${therapy.color}40` }}>{therapy.frequency}</Badge>
                <Badge className="bg-gray-700/50 text-gray-300 text-xs capitalize">{therapy.category}</Badge>
                <Button
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-500 text-white text-xs"
                  onClick={(e) => { e.stopPropagation(); onStartTherapy(therapy) }}
                >
                  <Play className="h-3 w-3 mr-1" /> Iniciar
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
