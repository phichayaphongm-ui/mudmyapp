'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { useEffect } from 'react'
import type { Pin } from '@/lib/types'
import { useLanguage } from '@/contexts/language-context'
import { ArrowRight } from 'lucide-react'

// Fix Leaflet marker icons in Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

const CATEGORY_CONFIG: Record<string, { color: string; rgb: string; gradStart: string; gradEnd: string; svg: string }> = {
  sell: { 
    color: '#FF7A00', 
    rgb: '255, 122, 0',
    gradStart: '#FF9432', 
    gradEnd: '#EA580C',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 11-1 9H5l-1-9"/><path d="M10 11V7a2 2 0 1 1 4 0v4"/><path d="M9 11V7a2 2 0 1 0-4 0v4"/><path d="M20 11H4"/><path d="M20 11V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6"/><path d="M7 11h10"/></svg>' 
  },
  service: { 
    color: '#00B894', 
    rgb: '0, 184, 148',
    gradStart: '#20E3B2', 
    gradEnd: '#00A884',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1-2.51-2.51l-3.77 3.77Z"/><path d="m20 9.5-1.9 1.9"/><path d="m20 22-5-5"/><path d="m17 17 5 5"/><path d="m3.5 7 2.8 2.8c.38.39 1 .39 1.4 0l7.4-7.4c.9-.9.4-2.4-.8-2.4H4.5c-1.1 0-2 .9-2 2v2.5c0 .5.2 1 .6 1.4Z"/></svg>' 
  },
  marketplace: { 
    color: '#F39C12', 
    rgb: '243, 156, 18',
    gradStart: '#F7B731', 
    gradEnd: '#E67E22',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M16 8V6a4 4 0 0 0-8 0v2"/><circle cx="12" cy="14" r="1.5"/></svg>' 
  },
  jobs: { 
    color: '#D97706', 
    rgb: '217, 119, 6',
    gradStart: '#F59E0B', 
    gradEnd: '#B45309',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>' 
  },
  taxi: { 
    color: '#EAB308', 
    rgb: '234, 179, 8',
    gradStart: '#FACC15', 
    gradEnd: '#CA8A04',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>' 
  },
  property: { 
    color: '#6366F1', 
    rgb: '99, 102, 241',
    gradStart: '#818CF8', 
    gradEnd: '#4F46E5',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' 
  },
  fuel_ev: { 
    color: '#2563EB', 
    rgb: '37, 99, 235',
    gradStart: '#3B82F6', 
    gradEnd: '#1D4ED8',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22h12"/><path d="M4 9V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L19 6"/><path d="M4 9h10"/></svg>' 
  },
  events: { 
    color: '#8B5CF6', 
    rgb: '139, 92, 246',
    gradStart: '#A78BFA', 
    gradEnd: '#7C3AED',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' 
  },
  news: { 
    color: '#334155', 
    rgb: '51, 65, 85',
    gradStart: '#475569', 
    gradEnd: '#1E293B',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>' 
  },
  emergency: { 
    color: '#DC2626', 
    rgb: '220, 38, 38',
    gradStart: '#EF4444', 
    gradEnd: '#B91C1C',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 5 7 7-7 7-7-7 7-7Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>' 
  },
  buy: { 
    color: '#F97316', 
    rgb: '249, 115, 22',
    gradStart: '#FB923C', 
    gradEnd: '#EA580C',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="m15 11-1 9H5l-1-9"/><path d="M10 11V7a2 2 0 1 1 4 0v4"/><path d="M9 11V7a2 2 0 1 0-4 0v4"/><path d="M20 11H4"/><path d="M20 11V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6"/><path d="M7 11h10"/></svg>' 
  },
  delivery: { 
    color: '#E11D48', 
    rgb: '225, 29, 72',
    gradStart: '#F43F5E', 
    gradEnd: '#BE123C',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>' 
  },
  hiring: { 
    color: '#B45309', 
    rgb: '180, 83, 9',
    gradStart: '#D97706', 
    gradEnd: '#92400E',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>' 
  },
  rental: { 
    color: '#7C3AED', 
    rgb: '124, 58, 237',
    gradStart: '#9333EA', 
    gradEnd: '#6B21A8',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><circle cx="4" cy="19" r="2"/><path d="M20 16a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v11Z"/><path d="m15 7 3-3"/><path d="m9 11 3 3"/><path d="m5 15 3 3"/><path d="m2 18 3 3"/><path d="M20 10h-5"/></svg>' 
  },
  freelance: { 
    color: '#DB2777', 
    rgb: '219, 39, 119',
    gradStart: '#EC4899', 
    gradEnd: '#BE185D',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>' 
  },
  job: { 
    color: '#CA8A04', 
    rgb: '202, 138, 4',
    gradStart: '#EAB308', 
    gradEnd: '#A16207',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>' 
  },
  real_estate: { 
    color: '#4338CA', 
    rgb: '67, 56, 202',
    gradStart: '#6366F1', 
    gradEnd: '#3730A3',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' 
  },
  need_service: { 
    color: '#047857', 
    rgb: '4, 120, 87',
    gradStart: '#10B981', 
    gradEnd: '#065F46',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M10 18H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v2.1"/><path d="M14 18h8"/><path d="M18 14v8"/><path d="M7 10h4"/><path d="M7 14h2"/></svg>' 
  },
}

const createCategoryIcon = (category: string, isSelected: boolean) => {
  const info = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.sell;
  const isEmergency = category === 'emergency';
  
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="pin-3d-marker ${isSelected ? 'marker-selected' : ''} ${isEmergency ? 'marker-emergency-minimal' : ''}" 
           style="--pin-color: ${info.color}; --pin-rgb: ${info.rgb};">
        <!-- Ground Radar Ripples -->
        <div class="pin-ground-ripples">
          <div class="ground-shadow"></div>
          <div class="ground-ring ground-ring-3"></div>
          <div class="ground-ring ground-ring-2"></div>
          <div class="ground-ring ground-ring-1"></div>
        </div>

        <!-- 3D Teardrop Pin Body -->
        <div class="pin-3d-head">
          <svg viewBox="0 0 44 56" fill="none" xmlns="http://www.w3.org/2000/svg" class="pin-3d-svg">
            <defs>
              <linearGradient id="pin-grad-${category}-${isSelected ? 'sel' : 'def'}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${info.gradStart}" />
                <stop offset="100%" stop-color="${info.gradEnd}" />
              </linearGradient>
            </defs>
            <!-- Teardrop drop-pin body -->
            <path d="M22 0C9.85 0 0 9.85 0 22C0 36 22 56 22 56C22 56 44 36 44 22C44 9.85 34.15 0 22 0Z" 
                  fill="url(#pin-grad-${category}-${isSelected ? 'sel' : 'def'})"/>
            <!-- 3D Light Highlight Bevel -->
            <path d="M22 2C32.5 2 41 10.5 41 21C41 24.5 39 29.5 36 34C34 25 29 11 17 5.5C18.6 3.2 20.2 2 22 2Z" 
                  fill="white" fill-opacity="0.28"/>
          </svg>

          <!-- White Disc Badge with Category Icon -->
          <div class="pin-3d-icon-badge">
            ${info.svg}
          </div>
        </div>
      </div>
    `,
    iconSize: [48, 64],
    iconAnchor: [24, 58],
    popupAnchor: [0, -58]
  });
}

interface LeafletMapProps {
  pins: Pin[]
  selectedPin: Pin | null
  onPinSelect: (pin: Pin | null) => void
  center?: [number, number]
  zoom?: number
  theme?: string
  mapStyle?: 'standard' | 'voyager' | 'positron' | 'dark' | 'satellite'
  is3dMode?: boolean
  userLocation?: [number, number]
  radiusKm?: number | null
}

// Helper to update map center when center prop changes
function MapUpdater({ center, zoom, animate = true }: { center?: [number, number], zoom?: number, animate?: boolean }) {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()
  }, [map])

  const centerLat = center?.[0]
  const centerLng = center?.[1]
  useEffect(() => {
    if (center && typeof center[0] === 'number' && typeof center[1] === 'number') {
      const targetZoom = zoom || map.getZoom()
      map.setView(center, targetZoom, { animate })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerLat, centerLng, zoom, map, animate])

  return null
}



const createClusterCustomIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `
      <div class="custom-marker-cluster">
        <div class="cluster-inner">
          <span>${count}</span>
        </div>
      </div>
    `,
    className: 'marker-cluster-custom',
    iconSize: L.point(42, 42, true),
  });
};

export default function LeafletMap({
  pins,
  selectedPin,
  onPinSelect,
  center, 
  zoom = 13,
  theme = 'light',
  mapStyle = 'standard',
  is3dMode = false,
  userLocation,
  radiusKm
}: LeafletMapProps) {
  const { t } = useLanguage()
  
  // Use userLocation or Bangkok as default for initial load
  const initialMapCenter = userLocation || [13.7563, 100.5018] as [number, number]
 
  const userIcon = L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div class="user-location-wrapper">
        <div class="user-location-pulse"></div>
        <div class="user-location-dot"></div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  })

  // Keep all layers key-free so the map remains usable in production.
  let tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  let attribution = '&copy; OpenStreetMap contributors'

  const useDarkTiles = mapStyle === 'dark' || (theme === 'dark' && mapStyle === 'standard')

  if (useDarkTiles) {
    tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    attribution = '&copy; OpenStreetMap contributors'
  } else if (mapStyle === 'voyager') {
    tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
    attribution = '&copy; Esri &amp; OpenStreetMap contributors'
  } else if (mapStyle === 'positron') {
    tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    attribution = '&copy; OpenStreetMap contributors'
  } else if (mapStyle === 'satellite') {
    tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    attribution = '&copy; Esri &amp; Maxar'
  }

  const isDark = useDarkTiles
  const isPositron = mapStyle === 'positron'

  return (
    <div
      className={`w-full h-full ${is3dMode ? 'map-3d-perspective' : ''} ${isDark ? 'map-dark-mode' : ''} ${isPositron ? 'map-positron-mode' : ''}`}
      aria-hidden="true"
      tabIndex={-1}
    >
      <MapContainer
        center={initialMapCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        maxZoom={19}
        minZoom={3}
      >
        <TileLayer
          attribution={attribution}
          url={tileUrl}
          className={isPositron ? 'map-positron-tiles' : undefined}
          subdomains={mapStyle === 'satellite' ? 'abc' : 'abcd'}
          maxZoom={19}
        />
        
        {/* Updates map center when center prop changes (GPS locate, pin select) */}
        <MapUpdater center={center} zoom={zoom} />
        
        <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={createClusterCustomIcon}
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
        maxClusterRadius={40}
        disableClusteringAtZoom={12}
        zoomToBoundsOnClick={true}
      >
        {pins.map((pin) => {
          return (
            <Marker
              key={pin.id}
              position={[pin.lat, pin.lng]}
              icon={createCategoryIcon(pin.category, selectedPin?.id === pin.id)}
              eventHandlers={{
                click: () => onPinSelect(pin)
              }}
            >
              <Popup className="custom-popup" key={`popup-${pin.id}`}>
                <div className="flex flex-col min-w-[220px] max-w-[260px] animate-scale-in">
                  <div className="w-full h-28 rounded-2xl overflow-hidden mb-3 shadow-sm border border-white/20 bg-muted/30 flex items-center justify-center relative">
                    {(() => {
                      const hasImages = Array.isArray(pin.images) && pin.images.length > 0 && pin.images.some(img => typeof img === 'string' && img.length > 0);
                      const imageUrl = hasImages ? pin.images.find(img => typeof img === 'string' && img.length > 0) : (typeof pin.images === 'string' && (pin.images as string).startsWith('http') ? pin.images : null);
                      
                      if (imageUrl) {
                        return (
                          <img 
                            src={imageUrl} 
                            alt="" 
                            key={imageUrl} 
                            className="w-full h-full object-cover transition-transform hover:scale-110 duration-700" 
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/logo2.png';
                              target.classList.add('object-contain', 'p-4', 'opacity-10');
                            }}
                          />
                        );
                      }
                      
                      return (
                        <div className="flex flex-col items-center justify-center gap-2 opacity-10">
                          <img src="/logo2.png" alt="Mudmy" className="w-12 h-12 object-contain grayscale" />
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="px-1">
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h3 className="font-extrabold text-[15px] tracking-tight text-foreground line-clamp-1 leading-tight flex-1">
                        {pin.title}
                      </h3>
                      {pin.radius === -1 && (
                        <span className="shrink-0 bg-secondary/10 text-secondary text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest border border-secondary/20">
                          TH
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                      {pin.description}
                    </p>
                    
                    <div className="flex items-center justify-between pt-2.5 border-t border-border/40">
                      {pin.priceLabel ? (
                        <div className="flex flex-col">
                          <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">{t('createPin.form.price')}</span>
                          <span className="text-secondary font-black text-sm italic tracking-tight">{pin.priceLabel}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">{t('pinDetail.noPriceSpecified')}</span>
                      )}
                      
                      <div className="group w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary shadow-sm border border-primary/10 transition-all hover:bg-primary hover:text-white hover:scale-105 active:scale-95">
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>

      {userLocation && (
        <Marker 
          position={userLocation} 
          icon={userIcon}
          zIndexOffset={-500} // Lower z-index so it doesn't block other markers
          interactive={true}
        >
          <Popup className="custom-popup" closeButton={true}>
            <div className="p-2 text-center">
              <p className="font-bold text-primary">{t('map.youAreHere')}</p>
              <p className="text-[10px] text-muted-foreground">{t('map.youAreHereShort')}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {userLocation && radiusKm && (
        <Circle
          center={userLocation}
          radius={radiusKm * 1000}
          pathOptions={{ 
            color: '#3B82F6', 
            fillColor: '#3B82F6', 
            fillOpacity: 0.1, 
            weight: 1.5, 
            dashArray: '4 4',
            interactive: false // Make the circle not block clicks
          }}
        />
      )}

      {selectedPin && selectedPin.radius && selectedPin.radius > 0 && (
        <Circle
          center={[selectedPin.lat, selectedPin.lng]}
          radius={selectedPin.radius * 1000}
          pathOptions={{
            color: CATEGORY_CONFIG[selectedPin.category]?.color || '#3B82F6',
            fillColor: CATEGORY_CONFIG[selectedPin.category]?.color || '#3B82F6',
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '5, 10',
            interactive: false // Make the circle not block clicks
          }}
        />
      )}

      </MapContainer>
    </div>
  )
}
