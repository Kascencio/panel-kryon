// hooks/useSessionChannel.ts -----------------------------------------
import { useEffect, useRef, useCallback } from "react"

export type ChannelMsg =
  | { type: "init"; payload: any }
  | { type: "update"; payload: any }
  | { type: "action"; action: "pause" | "play" | "stop" | "vol"; value?: any }

export function useSessionChannel(
  onMessage: (msg: ChannelMsg) => void,
  channelName = "cabina-session",
) {
  const channelRef = useRef<BroadcastChannel | null>(null)

  // open once
  useEffect(() => {
    const ch = new BroadcastChannel(channelName)
    channelRef.current = ch
    ch.onmessage = (ev) => onMessage(ev.data as ChannelMsg)
    return () => ch.close()
  }, [onMessage, channelName])

  // helper sender
  const post = useCallback((msg: ChannelMsg) => {
    channelRef.current?.postMessage(msg)
  }, [])

  return post
}
