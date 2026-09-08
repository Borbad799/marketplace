import { useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'
import { API_URL } from '../services/api'
import { useAuth } from '../store/auth'

export function useSocket(onMessage?: (payload: unknown) => void, onNotif?: (payload: unknown) => void) {
  const token = useAuth((s) => s.token)
  const ref = useRef<Socket | null>(null)

  useEffect(() => {
    if (!token) return
    const socket = io(API_URL || '/', { auth: { token }, transports: ['websocket', 'polling'] })
    ref.current = socket
    if (onMessage) socket.on('message', onMessage)
    if (onNotif) socket.on('notification', onNotif)
    return () => {
      socket.disconnect()
      ref.current = null
    }
  }, [token, onMessage, onNotif])

  return ref
}
