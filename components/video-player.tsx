"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Maximize,
  Minimize,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

/* ─────────────────────────────── types ─────────────────────────────── */
interface Props {
  sessionActive: boolean
  sessionDuration: "corto" | "mediano" | "largo"
  selectedTherapy: any | null
  onVideoComplete?: () => void
  onVideoDurationChange?: (duration: number | null) => void
}

/* ─────────────────────────── helpers ─────────────────────────── */
const durSuffix = (d: Props["sessionDuration"]) =>
  d === "corto" ? "4min" : d === "mediano" ? "15min" : "20min"

const fmt = (s: number) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(s % 60)
    .toString()
    .padStart(2, "0")}`

/* ═════════════════════════ component ═════════════════════════ */
export default function VideoPlayer({
  sessionActive,
  sessionDuration,
  selectedTherapy,
  onVideoComplete,
  onVideoDurationChange,
}: Props) {
  /* ui state */
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(70) // 0‑100
  const [muted, setMuted] = useState(true) // start muted
  const [isFull, setIsFull] = useState(false)

  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  )
  const [errMsg, setErrMsg] = useState<string | null>(null)

  /* refs */
  const vidRef = useRef<HTMLVideoElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  /* ────────── build candidate sources ────────── */
  const srcList = useCallback((): string[] => {
    if (!selectedTherapy) return []
    const base = selectedTherapy.frequency || selectedTherapy.id || "general"
    const suf = durSuffix(sessionDuration)
    return [
      `/videos/${base}-${suf}.mp4`,
      `/videos/${base}-${suf}.webm`,
      `/videos/fallback-${suf}.mp4`,
    ]
  }, [selectedTherapy, sessionDuration])

  /* ────────── loader ────────── */
  const loadVideo = useCallback(async () => {
    if (!selectedTherapy || !vidRef.current) return
    if (status === "ready") return // evita recarga infinita

    setStatus("loading")
    setErrMsg(null)

    const video = vidRef.current

    for (const src of srcList()) {
      try {
        const head = await fetch(src, { method: "HEAD" })
        if (!head.ok) continue

        video.src = src
        video.muted = true
        video.volume = 0

        await new Promise<void>((res, rej) => {
          const ok = () => {
            video.removeEventListener("canplay", ok)
            video.removeEventListener("error", fail)
            res()
          }
          const fail = () => {
            video.removeEventListener("canplay", ok)
            video.removeEventListener("error", fail)
            rej(new Error("error loading"))
          }
          video.addEventListener("canplay", ok, { once: true })
          video.addEventListener("error", fail, { once: true })
        })

        setDuration(video.duration)
        onVideoDurationChange?.(video.duration)
        setStatus("ready")
        toast({
          title: "Video cargado",
          description: `${selectedTherapy.name} (${Math.floor(
            video.duration,
          )} s)`,
        })
        return
      } catch {
        continue
      }
    }

    setStatus("error")
    setErrMsg("No se pudo cargar un archivo de video válido")
  }, [selectedTherapy, srcList, status, toast, onVideoDurationChange])

  /* carga inicial / cuando cambie terapia + duración */
  useEffect(() => {
    if (selectedTherapy) loadVideo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTherapy, sessionDuration])

  /* eventos básicos */
  useEffect(() => {
    const v = vidRef.current
    if (!v) return
    const t = () => setCurrent(v.currentTime)
    const p = () => setPlaying(true)
    const s = () => setPlaying(false)
    const e = () => {
      setPlaying(false)
      setCurrent(0)
      onVideoComplete?.()
    }
    const er = () => {
      setStatus("error")
      setErrMsg("Error de reproducción")
    }
    v.addEventListener("timeupdate", t)
    v.addEventListener("play", p)
    v.addEventListener("pause", s)
    v.addEventListener("ended", e)
    v.addEventListener("error", er)
    return () => {
      v.removeEventListener("timeupdate", t)
      v.removeEventListener("play", p)
      v.removeEventListener("pause", s)
      v.removeEventListener("ended", e)
      v.removeEventListener("error", er)
    }
  }, [onVideoComplete])

  /* autoplay muted */
  useEffect(() => {
    const v = vidRef.current
    if (!v || status !== "ready") return
    if (sessionActive && muted && !playing) {
      v.play().catch((e) => console.warn("Autoplay blocked:", e))
    }
    if ((!sessionActive || !muted) && playing && !sessionActive) {
      v.pause()
    }
  }, [sessionActive, status, muted, playing])

  /* ────────── handlers ────────── */
  const togglePlay = async () => {
    const v = vidRef.current
    if (!v || status !== "ready") return

    if (playing) {
      v.pause()
    } else {
      if (muted) {
        setMuted(false)
        v.muted = false
        v.volume = volume / 100
      }
      try {
        await v.play()
      } catch (err) {
        console.error(err)
        setStatus("error")
        setErrMsg("Reproducción bloqueada")
      }
    }
  }

  const changeVol = (val: number[]) => {
    const nv = val[0]
    setVolume(nv)
    if (vidRef.current && !muted) vidRef.current.volume = nv / 100
  }

  const toggleMute = () => {
    setMuted((m) => {
      const nm = !m
      if (vidRef.current) {
        vidRef.current.muted = nm
        vidRef.current.volume = nm ? 0 : volume / 100
      }
      return nm
    })
  }

  const restart = () => {
    if (vidRef.current) {
      vidRef.current.currentTime = 0
      setCurrent(0)
    }
  }

  const seek = (v: number[]) => {
    if (vidRef.current) {
      vidRef.current.currentTime = v[0]
      setCurrent(v[0])
    }
  }

  const toggleFull = () => {
    if (!wrapRef.current) return
    isFull ? document.exitFullscreen?.() : wrapRef.current.requestFullscreen?.()
  }

  /* detectar cambios de fullscreen */
  useEffect(() => {
    const f = () => setIsFull(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", f)
    return () => document.removeEventListener("fullscreenchange", f)
  }, [])

  /* ────────── ui helpers ────────── */
  const track = duration ? (current / duration) * 100 : 0
  const badge =
    status === "loading"
      ? ["Cargando", "bg-blue-900/30 text-blue-400", <Loader2 key="i" className="h-3 w-3 animate-spin" />]
      : status === "ready"
      ? ["Listo", "bg-green-900/30 text-green-400", <CheckCircle key="i" className="h-3 w-3" />]
      : status === "error"
      ? ["Error", "bg-red-900/30 text-red-400", <AlertCircle key="i" className="h-3 w-3" />]
      : ["Sin cargar", "bg-gray-900/30 text-gray-400", <AlertCircle key="i" className="h-3 w-3" />]

  /* ────────── render ────────── */
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-white text-sm">
          <span>Video</span>
          <Badge className={`flex items-center gap-1 border-transparent ${badge[1]}`}>
            {badge[2]}
            {badge[0]}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* contenedor video */}
        <div ref={wrapRef} className="relative rounded overflow-hidden aspect-video bg-black">
          <video ref={vidRef} className="w-full h-full object-cover" preload="metadata" playsInline />

          {status === "loading" && (
            <div className="absolute inset-0 grid place-content-center bg-black/60">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
              <AlertCircle className="h-6 w-6 mb-2 text-red-400" />
              <p className="text-sm mb-3">{errMsg}</p>
              <Button size="sm" onClick={loadVideo} className="bg-red-600 hover:bg-red-500">
                Reintentar
              </Button>
            </div>
          )}

          {status === "ready" && (
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={togglePlay} className="text-white h-6 w-6 p-0">
                  {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </Button>
                <div className="flex-1">
                  <Progress value={track} className="h-1" />
                </div>
                <span className="text-xs text-white">
                  {fmt(current)} / {fmt(duration)}
                </span>
                <Button variant="ghost" size="sm" onClick={toggleFull} className="text-white h-6 w-6 p-0">
                  {isFull ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* controles compactos */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={togglePlay} disabled={status !== "ready"} className="h-7 w-7 p-0">
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={restart} disabled={status !== "ready"} className="h-7 w-7 p-0">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1 flex-1 max-w-[120px]">
            <Button variant="ghost" size="sm" onClick={toggleMute} className="h-7 w-7 p-0">
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={[muted ? 0 : volume]}
              min={0}
              max={100}
              step={5}
              onValueChange={changeVol}
              disabled={status !== "ready"}
              className="flex-1"
            />
            <span className="text-xs text-gray-400 w-8 text-right">{muted ? 0 : volume}%</span>
          </div>
        </div>

        {/* seek bar grande */}
        {status === "ready" && (
          <Slider
            value={[current]}
            max={duration}
            step={0.1}
            onValueChange={seek}
            disabled={status !== "ready"}
            className="w-full"
          />
        )}
      </CardContent>
    </Card>
  )
}
