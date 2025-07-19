"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Timer, Play, Pause } from "lucide-react"

interface TimerDisplayProps {
  duration: number // en minutos
  isActive: boolean
  onComplete: () => void
}

export default function TimerDisplay({ duration, isActive, onComplete }: TimerDisplayProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60) // convertir a segundos
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (isActive) {
      setTimeLeft(duration * 60)
      setProgress(0)
    }
  }, [duration, isActive])

  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, onComplete])

  useEffect(() => {
    const totalSeconds = duration * 60
    const elapsed = totalSeconds - timeLeft
    const progressPercent = (elapsed / totalSeconds) * 100
    setProgress(progressPercent)
  }, [timeLeft, duration])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getProgressColor = () => {
    if (progress < 33) return "bg-green-500"
    if (progress < 66) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg flex items-center">
          <Timer className="mr-2 h-5 w-5 text-cyan-400" />
          Temporizador de Sesión
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Display del tiempo */}
        <div className="text-center">
          <div className="text-4xl font-mono font-bold text-white mb-2">{formatTime(timeLeft)}</div>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
            {isActive ? (
              <>
                <Play className="h-4 w-4 text-green-400" />
                <span>Sesión en progreso</span>
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 text-gray-400" />
                <span>Sesión pausada</span>
              </>
            )}
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Progreso</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${getProgressColor()}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Información adicional */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-2 bg-gray-700/50 rounded">
            <div className="text-gray-400">Duración Total</div>
            <div className="text-white font-medium">{duration} min</div>
          </div>
          <div className="text-center p-2 bg-gray-700/50 rounded">
            <div className="text-gray-400">Tiempo Restante</div>
            <div className="text-white font-medium">{Math.ceil(timeLeft / 60)} min</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
