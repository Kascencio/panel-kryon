"use client"

import { useRef, useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, RotateCcw, Volume2, VolumeX, AlertCircle, Music } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Therapy } from "@/components/session-therapies"

interface Props {
  sessionActive: boolean
  sessionDuration: "corto" | "mediano" | "largo"
  selectedTherapy: Therapy | null
  onAudioComplete?: () => void
  onAudioDurationChange?: (duration: number | null) => void
  preferFlac?: boolean
}

const DUR_SUFFIX = { corto: "4min", mediano: "15min", largo: "20min" } as const
const durationSeconds = { corto: 4 * 60, mediano: 15 * 60, largo: 20 * 60 }

export default function AudioPlayer({
  sessionActive,
  sessionDuration,
  selectedTherapy,
  onAudioComplete,
  onAudioDurationChange,
  preferFlac = true,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const { toast } = useToast()

  const [isPlaying, setIsPlaying] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [audioFormat, setAudioFormat] = useState<"mp3" | "flac">("mp3")

  // Prepare source URLs
  const sources = useMemo(() => {
    if (!selectedTherapy) return []
    const suff = DUR_SUFFIX[sessionDuration]
    const freq = selectedTherapy.frequency || selectedTherapy.id || "general"
    const list: string[] = []
    if (preferFlac) list.push(`/audio/flac/${freq}-${suff}.flac`)
    list.push(`/audio/${freq}-${suff}.mp3`)
    return list
  }, [selectedTherapy, sessionDuration, preferFlac])

  // Reset on therapy or duration change
  useEffect(() => {
    setHasError(false)
    setCurrentTime(0)
    const a = audioRef.current
    if (a) a.pause()
  }, [selectedTherapy, sessionDuration])

  // Load and handle fallback
  useEffect(() => {
    const a = audioRef.current
    if (!a || sources.length === 0) return
    let idx = 0
    const loadSource = () => {
      a.src = sources[idx]
      setAudioFormat(sources[idx].endsWith(".flac") ? "flac" : "mp3")
      a.load()
    }
    const onError = () => {
      idx++
      if (idx < sources.length) {
        loadSource()
      } else {
        setHasError(true)
        toast({ title: "Error", description: `No se encontró audio para ${selectedTherapy?.name}`, variant: "destructive" })
      }
    }
    a.addEventListener("error", onError)
    // After setting listeners, load first source
    idx = 0
    loadSource()
    return () => {
      a.removeEventListener("error", onError)
    }
  }, [sources, toast, selectedTherapy])

  // Track metadata and playback
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onLoaded = () => {
      setAudioDuration(a.duration)
      onAudioDurationChange?.(a.duration)
    }
    const onTime = () => setCurrentTime(a.currentTime)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnd = () => {
      setIsPlaying(false)
      setUserPaused(false)
      onAudioComplete?.()
    }
    a.addEventListener("loadedmetadata", onLoaded)
    a.addEventListener("timeupdate", onTime)
    a.addEventListener("play", onPlay)
    a.addEventListener("pause", onPause)
    a.addEventListener("ended", onEnd)
    return () => {
      a.removeEventListener("loadedmetadata", onLoaded)
      a.removeEventListener("timeupdate", onTime)
      a.removeEventListener("play", onPlay)
      a.removeEventListener("pause", onPause)
      a.removeEventListener("ended", onEnd)
    }
  }, [onAudioComplete, onAudioDurationChange])

  // Autoplay/pause with session
  useEffect(() => {
    const a = audioRef.current
    if (!a || hasError) return
    if (sessionActive && !userPaused) {
      a.play().catch(() => setHasError(true))
    } else {
      a.pause()
    }
  }, [sessionActive, userPaused, hasError])

  const togglePlay = async () => {
    const a = audioRef.current
    if (!a || hasError) return
    if (isPlaying) {
      a.pause(); setUserPaused(true)
    } else {
      try { await a.play(); setUserPaused(false) } catch { setHasError(true) }
    }
  }
  const handleSeek = (vals: number[]) => { const v = vals[0]; if (audioRef.current) audioRef.current.currentTime = v }
  const handleVol = (vals: number[]) => { const v = vals[0]; if (audioRef.current) audioRef.current.volume = isMuted ? 0 : v; setVolume(v) }
  const toggleMute = () => { const m = !isMuted; if (audioRef.current) audioRef.current.volume = m ? 0 : volume; setIsMuted(m) }
  const restart = () => { if (audioRef.current) { audioRef.current.currentTime = 0; setCurrentTime(0) } }
  const fmtTime = (s: number) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`
  const sessionLimit = durationSeconds[sessionDuration]

  if (!selectedTherapy) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4 text-center text-gray-400">
          Selecciona una terapia para reproducir audio
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Music className="h-4 w-4"/>Reproductor de Audio
          <Badge className={`text-xs ${audioFormat==="flac"?"bg-purple-900/30 text-purple-400":"bg-blue-900/30 text-blue-400"}`}>{audioFormat.toUpperCase()}</Badge>
          {hasError && <Badge className="bg-red-900/30 text-red-400 border-red-600/30"><AlertCircle className="h-3 w-3 mr-1"/>ERROR</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={audioDuration?(currentTime/audioDuration)*100:0} className="w-full h-2" />
        {audioDuration<sessionLimit && (
          <div className="text-yellow-300 text-xs">El audio es más corto que la sesión; terminará cuando acabe la sesión.</div>
        )}
        <div className="flex items-center space-x-4">
          <Button onClick={togglePlay} disabled={hasError} className="bg-green-600 hover:bg-green-500">
            {isPlaying?<Pause className="h-4 w-4"/>:<Play className="h-4 w-4"/>}
          </Button>
          <Button onClick={restart} variant="outline" disabled={hasError} className="border-gray-600 text-gray-300">
            <RotateCcw className="h-4 w-4"/>
          </Button>
          <Slider value={[currentTime]} max={audioDuration||sessionLimit} step={1} onValueChange={handleSeek} disabled={hasError} className="flex-1"/>
          <span className="text-sm text-gray-400 min-w-[60px] text-right">{fmtTime(currentTime)} / {fmtTime(audioDuration)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={toggleMute} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            {isMuted?<VolumeX className="h-4 w-4"/>:<Volume2 className="h-4 w-4"/>}
          </Button>
          <Slider value={[isMuted?0:volume]} min={0} max={1} step={0.1} onValueChange={handleVol} disabled={hasError} className="flex-1"/>
          <span className="text-xs text-gray-400">{Math.round((isMuted?0:volume)*100)}%</span>
        </div>
      </CardContent>
      <audio ref={audioRef} preload="metadata" className="hidden" />
    </Card>
  )
}
