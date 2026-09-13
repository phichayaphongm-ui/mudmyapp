const THAILAND_BOUNDS = {
  south: 5.61,
  west: 97.34,
  north: 20.47,
  east: 105.65,
} as const

export function isWithinThailandBounds(lat: number, lng: number): boolean {
  return Number.isFinite(lat)
    && Number.isFinite(lng)
    && lat >= THAILAND_BOUNDS.south
    && lat <= THAILAND_BOUNDS.north
    && lng >= THAILAND_BOUNDS.west
    && lng <= THAILAND_BOUNDS.east
}

export async function isThailandCoordinate(lat: number, lng: number): Promise<boolean> {
  if (!isWithinThailandBounds(lat, lng)) return false

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=3&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'th,en' },
        cache: 'no-store',
      },
    )
    if (!response.ok) return false

    const data = await response.json() as { address?: { country_code?: string } }
    return data.address?.country_code?.toLowerCase() === 'th'
  } catch {
    return false
  }
}

export function getThailandMapBounds(): [[number, number], [number, number]] {
  return [
    [THAILAND_BOUNDS.south, THAILAND_BOUNDS.west],
    [THAILAND_BOUNDS.north, THAILAND_BOUNDS.east],
  ]
}
