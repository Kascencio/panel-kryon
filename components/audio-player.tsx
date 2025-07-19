"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  AlertCircle,
  Music,
  Zap,
} from "lucide-react"
import { useAudioCache } from "@/components/audio-cache-provider"
import { useToast } from "@/hooks/use-toast"

interface Props {
  sessionActive: boolean
  sessionDuration: "corto" | "mediano" | "largo"
  selectedTherapy: any | null
  onAudioComplete?: () => void
  onAudioDurationChange?: (duration: number | null) => void
  preferFlac?: boolean
}

const DUR_SUFFIX = { corto: "4min", mediano: "15min", largo: "20min" } as const

export default function AudioPlayer({
  sessionActive,
  sessionDuration,
  selectedTherapy,
  onAudioComplete,
  onAudioDurationChange,
  preferFlac = true,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [audioFormat, setAudioFormat] = useState<"mp3" | "flac">("mp3")

  const audioRef = useRef<HTMLAudioElement>(null)
  const { getAudioUrl, isAudioReady } = useAudioCache()
  const { toast } = useToast()

  const buildPaths = useCallback(() => {
    if (!selectedTherapy) return []
    const suff = DUR_SUFFIX[sessionDuration]
    const freq = selectedTherapy.frequency || selectedTherapy.id || "general"
    const list: string[] = []
    if (preferFlac) list.push(`/audio/flac/${freq}-${suff}.flac`)
    list.push(`/audio/${freq}-${suff}.mp3`)
    return list
  }, [selectedTherapy, sessionDuration, preferFlac])

  const loadAudio = useCallback(async () => {
    if (!selectedTherapy || !audioRef.current) return
    setIsLoading(true)
    setHasError(false)
    for (const path of buildPaths()) {
      try {
        const cached = getAudioUrl(path)
        if (cached && isAudioReady(path)) {
          audioRef.current.src = cached
          setAudioFormat(path.endsWith(".flac") ? "flac" : "mp3")
          setIsLoading(false)
          return
        }
        const res = await fetch(path, { method: "HEAD" })
        if (res.ok) {
          audioRef.current.src = path
          setAudioFormat(path.endsWith(".flac") ? "flac" : "mp3")
          setIsLoading(false)
          return
        }
      } catch {}
    }
    setHasError(true)
    setIsLoading(false)
    toast({ title: "Error", description: `No se encontró audio para ${selectedTherapy.name}`, variant: "destructive" })
  }, [selectedTherapy, buildPaths, getAudioUrl, isAudioReady, toast])

  useEffect(() => {
    if (selectedTherapy) loadAudio()
  }, [selectedTherapy, sessionDuration, loadAudio])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onLoaded = () => { setDuration(a.duration); onAudioDurationChange?.(a.duration) }
    const onTime = () => setCurrentTime(a.currentTime)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnd = () => { setIsPlaying(false); setUserPaused(false); onAudioComplete?.() }
    const onErr = () => setHasError(true)
    a.addEventListener("loadedmetadata", onLoaded)
    a.addEventListener("timeupdate", onTime)
    a.addEventListener("play", onPlay)
    a.addEventListener("pause", onPause)
    a.addEventListener("ended", onEnd)
    a.addEventListener("error", onErr)
    return () => {
      a.removeEventListener("loadedmetadata", onLoaded)
      a.removeEventListener("timeupdate", onTime)
      a.removeEventListener("play", onPlay)
      a.removeEventListener("pause", onPause)
      a.removeEventListener("ended", onEnd)
      a.removeEventListener("error", onErr)
    }
  }, [onAudioComplete, onAudioDurationChange])

  // autoplay / autopause
  useEffect(() => {
    const a = audioRef.current
    if (!a || isLoading || hasError) return
    if (sessionActive && !userPaused && !isPlaying) {
      a.play().catch(() => setHasError(true))
    } else if ((!sessionActive || userPaused) && isPlaying) {
      a.pause()
    }
  }, [sessionActive, userPaused, isPlaying, isLoading, hasError])

  const togglePlay = async () => {
    const a = audioRef.current
    if (!a || isLoading || hasError) return
    try {
      if (isPlaying) {
        a.pause(); setUserPaused(true)
      } else {
        await a.play(); setUserPaused(false)
      }
    } catch {
      setHasError(true)
    }
  }

  const handleSeek = (v: number[]) => {
    if (audioRef.current) { audioRef.current.currentTime = v[0]; setCurrentTime(v[0]) }
  }
  const handleVol = (v: number[]) => {
    const nv = v[0]
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : nv
    setVolume(nv)
  }
  const toggleMute = () => {
    if (!audioRef.current) return
    const m = !isMuted
    audioRef.current.volume = m ? 0 : volume
    setIsMuted(m)
  }
  const restart = () => {
    if (audioRef.current) { audioRef.current.currentTime = 0; setCurrentTime(0) }
  }

  const fmtTime = (s: number) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`

  if (!selectedTherapy) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4 text-center">
          <p className="text-gray-400 text-sm">Selecciona una terapia para reproducir audio</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Music className="h-4 w-4"/>Reproductor de Audio
          <Badge className={`text-xs ${audioFormat==="flac"?"bg-purple-900/30 text-purple-400":"bg-blue-900/30 text-blue-400"}`}>
            {audioFormat.toUpperCase()}
          </Badge>
          {hasError && <Badge className="bg-red-900/30 text-red-400 border-red-600/30"><AlertCircle className="h-3 w-3 mr-1"/>ERROR</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={duration? (currentTime/duration)*100:0} className="w-full h-2"/>
        {duration < (duration) && (
          <div className="text-yellow-300 text-xs">
            El audio es más corto que la sesión; terminará cuando acabe.
          </div>
        )}
        <div className="flex items-center space-x-4">
          <Button onClick={togglePlay} disabled={isLoading||hasError} className="bg-green-600 hover:bg-green-500">
            {isPlaying? <Pause className="h-4 w-4"/> : <Play className="h-4 w-4"/>}
          </Button>
          <Button onClick={restart} variant="outline" disabled={isLoading||hasError} className="border-gray-600 text-gray-300">
            <RotateCcw className="h-4 w-4"/>
          </Button>
          <Slider value={[currentTime]} max={duration||100} step={1} onValueChange={handleSeek} disabled={isLoading||hasError} className="flex-1"/>
          <span className="text-sm text-gray-400 min-w-[60px] text-right">
            {fmtTime(currentTime)} / {fmtTime(duration)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={toggleMute} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            {isMuted? <VolumeX className="h-4 w-4"/> : <Volume2 className="h-4 w-4"/>}
          </Button>
          <Slider value={[isMuted?0:volume]} min={0} max={1} step={0.1} onValueChange={handleVol} disabled={hasError} className="flex-1"/>
          <span className="text-xs text-gray-400">{Math.round((isMuted?0:volume)*100)}%</span>
        </div>
      </CardContent>
      <audio ref={audioRef} preload="metadata" className="hidden"/>
    </Card>
  )
}
