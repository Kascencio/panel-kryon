// src/hooks/useMicrophone.ts
"use client"
import { useEffect, useRef, useState, useCallback } from "react"

/**
 * Activa un stream de micrófono mientras `enabled` sea true.
 * Devuelve { ready, stream, audioLevel } para que la UI sepa si realmente está encendido
 * y pueda mostrar un indicador visual del nivel de audio.
 */
export function useMicrophone(enabled: boolean) {
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micGainNodeRef = useRef<GainNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  
  const [ready, setReady] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0) // 0-100
  const [isPlaying, setIsPlaying] = useState(false)
  const [micVolume, setMicVolume] = useState(1.0) // Volumen del micrófono (0-1) - Aumentado al 100%

  // Función para cambiar el volumen del micrófono
  const changeMicVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    setMicVolume(clampedVolume)
    if (micGainNodeRef.current) {
      micGainNodeRef.current.gain.value = clampedVolume
    }
  }, [])

  // Función para analizar el nivel de audio
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    // Calcular el nivel promedio
    const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length
    const level = Math.min(100, (average / 255) * 100)
    
    setAudioLevel(level)
    
    // Continuar el análisis
    animationFrameRef.current = requestAnimationFrame(analyzeAudio)
  }, [])

  useEffect(() => {
    let mounted = true

    const manage = async () => {
      try {
        if (enabled && !streamRef.current) {
          /* Solicita acceso al mic */
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            } 
          })
          
          if (!mounted) return
          
          streamRef.current = stream
          
          // Configurar análisis de audio y reproducción
          try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
            const source = audioContextRef.current.createMediaStreamSource(stream)
            analyserRef.current = audioContextRef.current.createAnalyser()
            
            // Configurar analizador para nivel de audio
            analyserRef.current.fftSize = 256
            analyserRef.current.smoothingTimeConstant = 0.8
            
            // Crear un gain node para controlar el volumen del micrófono
            micGainNodeRef.current = audioContextRef.current.createGain()
            micGainNodeRef.current.gain.value = micVolume // Usar volumen dinámico (ahora 100% por defecto)
            
            // Conectar: micrófono → analizador
            source.connect(analyserRef.current)
            // Conectar: micrófono → gain → altavoces (se mezcla con otros audios)
            source.connect(micGainNodeRef.current)
            micGainNodeRef.current.connect(audioContextRef.current.destination)
            
            // Iniciar análisis
            animationFrameRef.current = requestAnimationFrame(analyzeAudio)
            
            setIsPlaying(true)
          } catch (audioErr) {
            console.warn("No se pudo configurar análisis de audio:", audioErr)
            // El micrófono funciona, pero sin análisis
          }
          
          setReady(true)
        } else if (!enabled && streamRef.current) {
          /* Apaga y libera pistas */
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
          }
          
          if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            try {
              audioContextRef.current.close()
            } catch (err) {
              console.warn("Error cerrando AudioContext:", err)
            }
            audioContextRef.current = null
          }
          
          analyserRef.current = null
          micGainNodeRef.current = null
          streamRef.current.getTracks().forEach((t) => t.stop())
          streamRef.current = null
          setReady(false)
          setAudioLevel(0)
          setIsPlaying(false)
        }
      } catch (err) {
        console.error("Micrófono:", err)
        setReady(false)
        setAudioLevel(0)
      }
    }

    manage()
    return () => {
      mounted = false
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close()
        } catch (err) {
          console.warn("Error cerrando AudioContext en cleanup:", err)
        }
      }
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [enabled, analyzeAudio])

  return { 
    ready, 
    stream: streamRef.current, 
    audioLevel, 
    isPlaying,
    micVolume,
    changeMicVolume
  }
}
