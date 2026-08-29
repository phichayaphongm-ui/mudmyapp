'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Star, CheckCircle2, Zap, Sparkles } from 'lucide-react'
import { getRecentActivities, type PulseEvent } from '@/lib/services/activity'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function CommunityTicker() {
  const [events, setEvents] = useState<PulseEvent[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await getRecentActivities()
        setEvents(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchActivities()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchActivities, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (events.length === 0) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length)
    }, 5000) // Change message every 5 seconds
    return () => clearInterval(timer)
  }, [events])

  if (loading || events.length === 0) return null

  const currentEvent = events[currentIndex]

  const getIcon = (type: string) => {
    switch (type) {
      case 'pin': return <MapPin className="w-3 h-3 text-primary" />
      case 'review': return <Star className="w-3 h-3 text-orange-400 fill-current" />
      case 'resolved': return <CheckCircle2 className="w-3 h-3 text-emerald-500" />
      default: return <Zap className="w-3 h-3 text-blue-500" />
    }
  }

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'pin': return 'bg-primary/10 border-primary/20'
      case 'review': return 'bg-orange-50 border-orange-100'
      case 'resolved': return 'bg-emerald-50 border-emerald-100'
      default: return 'bg-zinc-100 border-zinc-200'
    }
  }

  return (
    <div className="w-full px-4 mb-6">
      <div className="bg-white/50 backdrop-blur-xl border border-white/40 rounded-3xl h-14 overflow-hidden shadow-sm relative group">
        {/* Decorative elements */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/80 to-transparent z-10 pointer-events-none" />
        
        <div className="h-full flex items-center px-4 gap-3">
          {/* Label */}
          <div className="shrink-0 flex items-center gap-2">
            <div className="relative">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full animate-ping" />
            </div>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden sm:block">Pulse</span>
            <div className="w-px h-4 bg-zinc-200 ml-1 hidden sm:block" />
          </div>

          {/* Ticker Content */}
          <div className="flex-1 relative h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="absolute inset-0"
              >
                {currentEvent.targetPath ? (
                  <Link href={currentEvent.targetPath} className="h-full flex items-center gap-3">
                    <TickerItemContent currentEvent={currentEvent} getIcon={getIcon} getBadgeColor={getBadgeColor} />
                  </Link>
                ) : (
                  <div className="h-full flex items-center gap-3">
                    <TickerItemContent currentEvent={currentEvent} getIcon={getIcon} getBadgeColor={getBadgeColor} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

function TickerItemContent({ currentEvent, getIcon, getBadgeColor }: { currentEvent: PulseEvent, getIcon: any, getBadgeColor: any }) {
  return (
    <>
      <div className="flex items-center gap-2 max-w-full">
        <Avatar className="w-7 h-7 border-2 border-white shadow-sm shrink-0">
          <AvatarImage src={currentEvent.userAvatar} />
          <AvatarFallback className="bg-zinc-100 text-[10px] font-black uppercase">
            {currentEvent.userName.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex items-center gap-2">
          <span className="text-[11px] font-black text-zinc-900 truncate shrink-0">
            {currentEvent.userName}
          </span>
          
          <div className={cn(
            "px-2 py-0.5 rounded-full border flex items-center gap-1.5 whitespace-nowrap overflow-hidden max-w-[200px] sm:max-w-md",
            getBadgeColor(currentEvent.type)
          )}>
            {getIcon(currentEvent.type)}
            <span className="text-[10px] font-bold text-zinc-700 truncate">
              {currentEvent.content}
            </span>
          </div>
        </div>
      </div>

      <div className="ml-auto shrink-0 hidden md:block">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter opacity-50">
          เมื่อสักครู่
        </span>
      </div>
    </>
  )
}
