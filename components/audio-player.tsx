"use client"

import { useRef, useEffect, useState, useMemo, useCallback } from "react"
import {
  Play, Pause, RotateCcw, Volume2, VolumeX,
  AlertCircle, Music,
} from "lucide-react"
import { Button }         from "@/components/ui/button"
import {
  Card, CardContent, CardHeader, CardTitle
}                          from "@/components/ui/card"
import { Slider }         from "@/components/ui/slider"
import { Badge }          from "@/components/ui/badge"
import { Progress }       from "@/components/ui/progress"
    // importa según tu estructura
import { useToast } from "@/hooks/use-toast"
import { useAudioCache } from "@/components/audio-cache-provider"
import type { Therapy } from "@/components/session-therapies"

/* ────────── props ────────── */
interface Props {
  sessionActive : boolean
  sessionDuration : "corto" | "mediano" | "largo"
  selectedTherapy: Therapy | null
  onAudioComplete?       (): void
  onAudioDurationChange? (d: number | null): void
  preferFlac? : boolean        // por defecto TRUE
}

/* ────────── constantes ────────── */
const DUR_SUFFIX   = { corto:"4min", mediano:"15min", largo:"20min" } as const
const SESSION_SECS = { corto:4*60,  mediano:15*60,   largo:20*60  }

/* ══════════ COMPONENT ══════════ */
export default function AudioPlayer({
  sessionActive,
  sessionDuration,
  selectedTherapy,
  onAudioComplete,
  onAudioDurationChange,
  preferFlac = true,
}: Props) {
  const audioRef           = useRef<HTMLAudioElement>(null)
  const { toast }          = useToast()
  const {
    getAudioUrl, isAudioReady,
  }                        = useAudioCache()

  /* --- UI state --- */
  const [playing, setPlaying]     = useState(false)
  const [userPaused, setPaused]   = useState(false)
  const [time,  setTime]          = useState(0)
  const [dur,   setDur]           = useState(0)
  const [vol,   setVol]           = useState(0.7)
  const [muted, setMuted]         = useState(false)
  const [error, setError]         = useState(false)
  const [fmt,   setFmt]           = useState<"mp3"|"flac">("mp3")

  /* ────────── 1) construir lista de candidatos ────────── */
  const sources = useMemo(() => {
    if (!selectedTherapy) return []
    const base = selectedTherapy.frequency || selectedTherapy.id
    const suf  = DUR_SUFFIX[sessionDuration]
    const list : string[] = []
    if (preferFlac) list.push(`/audio/flac/${base}-${suf}.flac`)
    list.push(`/audio/${base}-${suf}.mp3`)
    return list
  }, [selectedTherapy, sessionDuration, preferFlac])

  /* ────────── 2) helper para fijar src (caché → path) ────────── */
  const setSrc = useCallback((path:string) => {
    const a = audioRef.current
    if (!a) return
    const cached = getAudioUrl(path)
    a.src = cached && isAudioReady(path) ? cached : path
    setFmt(path.endsWith(".flac") ? "flac" : "mp3")
    a.load()
  }, [getAudioUrl, isAudioReady])

  /* ────────── 3) al cambiar de terapia / duración ────────── */
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    a.pause()
    setTime(0)
    setDur(0)
    setError(false)

    if (sources.length === 0) return
    let idx = 0

    const tryLoad = () => setSrc(sources[idx])

    const handleErr = () => {
      idx++
      if (idx < sources.length) tryLoad()
      else {
        setError(true)
        toast({ title:"Audio no encontrado", description:`No hay archivo para ${selectedTherapy?.name}`, variant:"destructive"})
      }
    }

    a.addEventListener("error", handleErr, { once:false })
    tryLoad()

    return () => a.removeEventListener("error", handleErr)
  }, [sources, setSrc, toast, selectedTherapy])

  /* ────────── 4) listeners de reproducción ────────── */
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const md = () => { setDur(a.duration); onAudioDurationChange?.(a.duration) }
    const tm = () => setTime(a.currentTime)
    const pl = () => setPlaying(true)
    const ps = () => setPlaying(false)
    const ed = () => { setPlaying(false); setPaused(false); onAudioComplete?.() }

    a.addEventListener("loadedmetadata", md)
    a.addEventListener("timeupdate", tm)
    a.addEventListener("play",  pl)
    a.addEventListener("pause", ps)
    a.addEventListener("ended", ed)
    return () => {
      a.removeEventListener("loadedmetadata", md)
      a.removeEventListener("timeupdate", tm)
      a.removeEventListener("play",  pl)
      a.removeEventListener("pause", ps)
      a.removeEventListener("ended", ed)
    }
  }, [onAudioComplete, onAudioDurationChange])

  /* ────────── 5) autoplay / autopause ────────── */
  useEffect(() => {
    const a = audioRef.current
    if (!a || error) return
    if (sessionActive && !userPaused)  { a.play().catch(()=>setError(true)) }
    else                                a.pause()
  }, [sessionActive, userPaused, error])

  /* ────────── helpers UI ────────── */
  const fmtMMSS = (s:number) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`
  const seek    = (v:number[]) => { if (audioRef.current) audioRef.current.currentTime = v[0] }
  const restart = () =>          { if (audioRef.current){ audioRef.current.currentTime = 0; setTime(0)}}
  const setVolUI= (v:number[])   => { const n=v[0]; setVol(n); if(audioRef.current && !muted) audioRef.current.volume=n }
  const tMute   = () =>          { const m=!muted; setMuted(m); if(audioRef.current) audioRef.current.volume=m?0:vol }
  const playP   = () =>          { if(error) return; const a=audioRef.current; if(!a)return; playing? (a.pause(),setPaused(true)) : a.play().then(()=>setPaused(false)).catch(()=>setError(true)) }

  const limit   = SESSION_SECS[sessionDuration]

  /* ────────── render ────────── */
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
        <CardTitle className="flex items-center gap-2 text-white text-sm">
          <Music className="h-4 w-4"/> Audio
          <Badge className={`text-xs ${fmt==="flac"?"bg-purple-900/30 text-purple-400":"bg-blue-900/30 text-blue-400"}`}>
            {fmt.toUpperCase()}
          </Badge>
          {error && (
            <Badge className="bg-red-900/30 text-red-400 border-red-600/30">
              <AlertCircle className="h-3 w-3 mr-1"/>ERROR
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        <Progress value={dur? (time/dur)*100 : 0} className="h-2"/>
        {dur < limit && (
          <p className="text-yellow-300 text-xs">
            El audio ({fmtMMSS(dur)}) es más corto que la sesión; se repetirá o
            terminará antes.
          </p>
        )}

        {/* controles principales */}
        <div className="flex items-center gap-4">
          <Button onClick={playP} disabled={error} className="bg-green-600 hover:bg-green-500">
            {playing ? <Pause className="h-4 w-4"/> : <Play className="h-4 w-4"/>}
          </Button>
          <Button variant="outline" onClick={restart} disabled={error} className="border-gray-600 text-gray-300">
            <RotateCcw className="h-4 w-4"/>
          </Button>
          <Slider value={[time]} max={dur||limit} step={1} onValueChange={seek} disabled={error} className="flex-1"/>
          <span className="min-w-[70px] text-sm text-gray-400 text-right">
            {fmtMMSS(time)} / {fmtMMSS(dur||0)}
          </span>
        </div>

        {/* volumen */}
        <div className="flex items-center gap-2">
          <Button onClick={tMute} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            {muted ? <VolumeX className="h-4 w-4"/> : <Volume2 className="h-4 w-4"/>}
          </Button>
          <Slider value={[muted?0:vol]} min={0} max={1} step={0.1} onValueChange={setVolUI} disabled={error} className="flex-1"/>
          <span className="text-xs text-gray-400">{Math.round((muted?0:vol)*100)}%</span>
        </div>
      </CardContent>

      <audio ref={audioRef} preload="metadata" className="hidden"/>
    </Card>
  )
}
