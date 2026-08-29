'use client'

import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { MapPin, Locate } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/language-context'

// Fix Leaflet marker icons
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

interface LocationPickerProps {
  lat: number
  lng: number
  onChange: (lat: number, lng: number) => void
  onAddressFound?: (address: string, district?: string, province?: string) => void
  category?: string
  radius?: number
}

const CATEGORY_ICONS: Record<string, { color: string, svg: string }> = {
  sell: { 
    color: '#3B82F6', 
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 11-1 9H5l-1-9"/><path d="M10 11V7a2 2 0 1 1 4 0v4"/><path d="M9 11V7a2 2 0 1 0-4 0v4"/><path d="M20 11H4"/><path d="M20 11V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6"/><path d="M7 11h10"/></svg>' 
  },
  service: { 
    color: '#10B981', 
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1-2.51-2.51l-3.77 3.77Z"/><path d="m20 9.5-1.9 1.9"/><path d="m20 22-5-5"/><path d="m17 17 5 5"/><path d="m3.5 7 2.8 2.8c.38.39 1 .39 1.4 0l7.4-7.4c.9-.9.4-2.4-.8-2.4H4.5c-1.1 0-2 .9-2 2v2.5c0 .5.2 1 .6 1.4Z"/></svg>' 
  },
  marketplace: { 
    color: '#0EA5E9', 
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/><path d="M5 9a3 3 0 0 1 6 0 3 3 0 0 1 6 0 3 3 0 0 1 6 0"/></svg>' 
  },
  jobs: { 
    color: '#F59E0B', 
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>' 
  },
  taxi: { 
    color: '#EAB308', 
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>' 
  },
  property: { 
    color: '#4F46E5', 
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' 
  },
  fuel_ev: { 
    color: '#0891B2', 
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22L15 22"/><path d="M18 22L21 22"/><path d="M7 22L7 7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15"/><path d="M19 12h2"/><path d="M12 9h1"/><path d="M12 12h1"/><path d="M12 15h1"/><path d="M19 12v10"/></svg>' 
  },
  events: { 
    color: '#9333EA', 
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' 
  },
  news: { 
    color: '#475569', 
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>' 
  },
  emergency: { 
    color: '#DC2626', 
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m12 5 7 7-7 7-7-7 7-7Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>' 
  },
}

const createCategoryIcon = (category?: string) => {
  const info = CATEGORY_ICONS[category || 'sell'] || CATEGORY_ICONS.sell;
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="premium-pin-3d-container marker-pulse" 
           style="--marker-color: ${info.color}">
        <div class="premium-pin-3d-shadow"></div>
        <div class="premium-pin-3d-body">
          <div class="premium-pin-3d-ring">
            <div class="premium-pin-3d-inner">
              <div class="premium-pin-3d-icon">
                ${info.svg}
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    iconSize: [48, 56],
    iconAnchor: [24, 56],
  });
}

function LocationMarker({ lat, lng, onChange, onAddressFound, category }: LocationPickerProps) {
  const fetchAddress = async (lat: number, lng: number) => {
    if (!onAddressFound) return
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: {
          'Accept-Language': 'th,en'
        }
      })
      const data = await response.json()
      if (data && data.display_name) {
        const addr = data.address || {}
        // In Thailand: city_district/suburb -> District (Khet/Amphoe), state -> Province (Changwat)
        const district = addr.city_district || addr.suburb || addr.town || addr.city || ''
        const province = addr.state || addr.province || ''
        onAddressFound(data.display_name, district, province)
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error)
    }
  }

  const _map = useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng)
      fetchAddress(e.latlng.lat, e.latlng.lng)
    },
  })

  return (
    <Marker 
      position={[lat, lng]} 
      draggable={true} 
      icon={createCategoryIcon(category)}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target
          const position = marker.getLatLng()
          onChange(position.lat, position.lng)
          fetchAddress(position.lat, position.lng)
        }
      }} 
    />
  )
}

function MapController({ lat, lng }: { lat: number, lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom())
  }, [lat, lng, map])
  return null
}

export default function LocationPicker({ lat, lng, onChange, onAddressFound, category, radius }: LocationPickerProps) {
  const { t } = useLanguage()
  const handleCurrentLocation = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onChange(pos.coords.latitude, pos.coords.longitude)
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

  const categoryColor = CATEGORY_ICONS[category || 'sell']?.color || '#2563EB';

  return (
    <div className="relative w-full h-64 rounded-3xl overflow-hidden border border-border group premium-map">
      <MapContainer
        center={[lat, lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <LocationMarker 
          lat={lat} 
          lng={lng} 
          onChange={onChange} 
          onAddressFound={onAddressFound} 
          category={category}
        />
        {radius && radius > 0 && (
          <Circle
            center={[lat, lng]}
            radius={radius * 1000}
            pathOptions={{
              fillColor: categoryColor,
              color: categoryColor,
              fillOpacity: 0.15,
              weight: 2,
              dashArray: '5, 10'
            }}
          />
        )}
        <MapController lat={lat} lng={lng} />
      </MapContainer>

      {/* Crosshair indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[400] opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-8 h-8 flex items-center justify-center text-primary/50">
          <div className="w-px h-full bg-primary/50 absolute" />
          <div className="h-px w-full bg-primary/50 absolute" />
        </div>
      </div>

      {/* Locate button overlay */}
      <div className="absolute bottom-4 right-4 z-[400]">
        <Button
          size="icon"
          variant="secondary"
          className="rounded-xl shadow-lg border border-border/50 backdrop-blur-md"
          onClick={handleCurrentLocation}
          title={t('map.useCurrentLocation')}
        >
          <Locate className="w-4 h-4" />
        </Button>
      </div>

      <div className="absolute top-4 left-4 z-[400] pointer-events-none">
        <div className="bg-card/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border/50 shadow-sm text-[10px] font-medium text-muted-foreground flex items-center gap-2">
          <MapPin className="w-3 h-3 text-primary" />
          {t('map.clickToSelect')}
        </div>
      </div>
    </div>
  )
}
