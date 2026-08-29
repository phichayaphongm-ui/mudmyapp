'use client'

import { useState, useEffect } from 'react'
import { MapPin, Layers, Locate } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useLanguage } from '@/contexts/language-context'
import type { Pin, PinCategory } from '@/lib/types'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'

// Dynamically import LeafletMap with no SSR
const LeafletMap = dynamic(() => import('./map/LeafletMap'), { 
  ssr: false,
  loading: () => {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center animate-bounce">
            <MapPin className="h-6 w-6 text-orange-500" />
          </div>
          <p className="text-xs text-muted-foreground font-medium animate-pulse">กำลังโหลดแผนที่คมชัด...</p>
        </div>
      </div>
    )
  }
})



interface MapViewProps {
  pins: Pin[]
  selectedPin: Pin | null
  onPinSelect: (pin: Pin | null) => void
  filterCategory: PinCategory | 'all'
  initialCenter?: [number, number]
  userLocation?: [number, number]
  setUserLocation?: (loc: [number, number]) => void
  radiusKm?: number | null
}

export function MapView({ pins, selectedPin, onPinSelect, filterCategory, initialCenter, userLocation, setUserLocation, radiusKm }: MapViewProps) {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [is3dMode, setIs3dMode] = useState(false)
  const [mapStyle, setMapStyle] = useState<'standard' | 'voyager' | 'positron' | 'dark' | 'satellite'>('standard')
  const [isLayersOpen, setIsLayersOpen] = useState(false)
  
  // Keep internal state as fallback if not provided
  const [internalLocation, setInternalLocation] = useState<[number, number] | undefined>(initialCenter)
  const actualLocation = userLocation !== undefined ? userLocation : internalLocation
  const setActualLocation = setUserLocation || setInternalLocation

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLocate = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setActualLocation([latitude, longitude])
          // Clear selected pin if we are centering on user
          onPinSelect(null)
        },
        (err) => {
          let errorMsg = 'Unknown location error';
          switch(err.code) {
            case err.PERMISSION_DENIED: errorMsg = 'User denied location access'; break;
            case err.POSITION_UNAVAILABLE: errorMsg = 'Location information is unavailable'; break;
            case err.TIMEOUT: errorMsg = 'Location request timed out'; break;
          }
          console.warn(`[Geolocation] Error getting location: ${errorMsg}`, err.message);
          alert(t('map.locationError'))
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      )
    } else {
      alert(t('map.browserNotSupported'))
    }
  }

  // Auto-locate on mount (unless initialCenter is provided)
  useEffect(() => {
    if (!initialCenter) {
      handleLocate();
    }
  }, [initialCenter]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredPins = filterCategory === 'all'
    ? pins
    : pins.filter((p) => p.category === filterCategory)

  const mapCenter = selectedPin 
    ? [selectedPin.lat, selectedPin.lng] as [number, number]
    : (initialCenter || actualLocation)



  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100 dark:bg-slate-950 select-none">
      {/* Real Map layer with Voyager HD & 3D pins */}
      <div className="absolute inset-0 z-0">
        <LeafletMap 
          pins={filteredPins}
          selectedPin={selectedPin}
          onPinSelect={onPinSelect}
          center={mapCenter}
          theme={mounted ? theme : 'light'}
          mapStyle={mapStyle}
          is3dMode={is3dMode}
          userLocation={actualLocation}
          radiusKm={radiusKm}
        />
      </div>

      {/* Floating Pin Count Badge (Top-left) */}
      <div className="absolute top-4 left-4 z-20 pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-lg shadow-black/5 px-3.5 py-1.5 rounded-2xl flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-sm shadow-primary/50" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {filteredPins.length} <span className="text-slate-500 dark:text-slate-400 font-normal">หมุด</span>
          </span>
        </div>
      </div>

      {/* Floating Map Controls (Right Side) */}
      <div className="absolute right-4 top-4 flex flex-col gap-2.5 z-20">
        {/* Locate GPS */}
        <button
          onClick={handleLocate}
          className="w-11 h-11 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-lg shadow-black/8 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-primary"
          title="ตำแหน่งปัจจุบัน"
        >
          <Locate className="w-5 h-5" />
        </button>

        {/* 3D Mode Toggle */}
        <button
          onClick={() => setIs3dMode(prev => !prev)}
          className={cn(
            "w-11 h-11 rounded-2xl backdrop-blur-xl border shadow-lg shadow-black/8 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center font-extrabold text-xs tracking-wider",
            is3dMode 
              ? "bg-primary text-white border-transparent shadow-primary/30 ring-2 ring-primary/40" 
              : "bg-white/95 dark:bg-slate-900/95 border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-primary"
          )}
          title="มุมมอง 3 มิติ"
        >
          3D
        </button>

        {/* Map Layers Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsLayersOpen(prev => !prev)}
            className={cn(
              "w-11 h-11 rounded-2xl backdrop-blur-xl border shadow-lg shadow-black/8 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center",
              isLayersOpen
                ? "bg-primary/10 dark:bg-primary/20 border-primary/40 text-primary"
                : "bg-white/95 dark:bg-slate-900/95 border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-primary"
            )}
            title="เปลี่ยนรูปแบบแผนที่"
          >
            <Layers className="w-5 h-5" />
          </button>

          {/* Layer Picker Dropdown */}
          {isLayersOpen && (
            <div className="absolute right-14 top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-2xl rounded-2xl p-2 w-44 flex flex-col gap-1 z-30 animate-in fade-in zoom-in-95 duration-200">
              <p className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1 tracking-wider">รูปแบบแผนที่</p>
              <button
                onClick={() => { setMapStyle('standard'); setIsLayersOpen(false); }}
                className={cn(
                  "flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors",
                  mapStyle === 'standard' ? "bg-primary text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                )}
              >
                <span>🗺️ ธรรมดา (OpenStreetMap)</span>
              </button>
              <button
                onClick={() => { setMapStyle('voyager'); setIsLayersOpen(false); }}
                className={cn(
                  "flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors",
                  mapStyle === 'voyager' ? "bg-primary text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                )}
              >
                <span>🎨 สีสันสดใส (Voyager)</span>
              </button>
              <button
                onClick={() => { setMapStyle('positron'); setIsLayersOpen(false); }}
                className={cn(
                  "flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors",
                  mapStyle === 'positron' ? "bg-primary text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                )}
              >
                <span>⚪ สว่างมินิมอล</span>
              </button>
              <button
                onClick={() => { setMapStyle('satellite'); setIsLayersOpen(false); }}
                className={cn(
                  "flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors",
                  mapStyle === 'satellite' ? "bg-primary text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                )}
              >
                <span>🛰️ ภาพดาวเทียม</span>
              </button>
              <button
                onClick={() => { setMapStyle('dark'); setIsLayersOpen(false); }}
                className={cn(
                  "flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors",
                  mapStyle === 'dark' ? "bg-primary text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                )}
              >
                <span>🌙 โหมดมืด</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
