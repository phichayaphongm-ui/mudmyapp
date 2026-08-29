'use client'

import { useEffect, useState } from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'
import { checkSupabaseConnection } from '@/lib/supabase'

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true)
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    // Check browser online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check Supabase connection
    const checkConnection = async () => {
      const connected = await checkSupabaseConnection()
      setIsSupabaseConnected(connected)
      
      // Show status only when there's a problem
      setShowStatus(!connected || !navigator.onLine)
    }

    checkConnection()
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  // Hide if everything is working
  if (isOnline && isSupabaseConnected && !showStatus) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-2 rounded-2xl shadow-lg backdrop-blur-xl border animate-in slide-in-from-top-4 fade-in',
        isOnline && isSupabaseConnected
          ? 'bg-emerald-500/90 text-white border-emerald-400/50'
          : 'bg-destructive/90 text-destructive-foreground border-destructive/50'
      )}
    >
      {isOnline && isSupabaseConnected ? (
        <>
          <Wifi className="w-4 h-4" />
          <span className="text-sm font-medium">เชื่อมต่อสำเร็จ</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-medium">
            {!isOnline ? 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต' : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'}
          </span>
        </>
      )}
    </div>
  )
}
