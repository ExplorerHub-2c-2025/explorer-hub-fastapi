import { useEffect, useState } from 'react'

//npm install react-leaflet leaflet --legacy-peer-deps
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface Business {
  id: number
  name: string
  description: string
  categories: string[]
  location: {
    address: string
    city: string
    state: string
    country: string
  }
  rating: number
  review_count: number
  price_level: number
  images: string[]
  tags: string[]
  is_active: boolean
  allows_bookings: boolean
  max_capacity?: number
}

interface MapComponentProps {
  businesses: Business[]
}

interface GeocodedBusiness extends Business {
  lat?: number
  lng?: number
}

const MapComponent: React.FC<MapComponentProps> = ({ businesses }) => {
  const [geocodedBusinesses, setGeocodedBusinesses] = useState<GeocodedBusiness[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Add spin animation CSS
    const style = document.createElement('style')
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  useEffect(() => {
    const geocodeBusinesses = async () => {
      setIsLoading(true)
      const geocoded: GeocodedBusiness[] = []

      for (const business of businesses) {
        if (!business.location.address || !business.location.city) continue

        const query = `${business.location.address}, ${business.location.city}, ${business.location.state}, ${business.location.country}`
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
          const data = await response.json()
          if (data.length > 0) {
            geocoded.push({
              ...business,
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon)
            })
          }
        } catch (error) {
          console.error('Error geocoding:', error)
        }
      }

      setGeocodedBusinesses(geocoded)
      setIsLoading(false)
    }

    if (businesses.length > 0) {
      geocodeBusinesses()
    } else {
      setGeocodedBusinesses([])
      setIsLoading(false)
    }
  }, [businesses])

  const center: [number, number] = geocodedBusinesses.length > 0
    ? [geocodedBusinesses[0].lat!, geocodedBusinesses[0].lng!]
    : [-34.6037, -58.3816] // Default to Buenos Aires or similar

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {geocodedBusinesses.map((business) => (
          business.lat && business.lng && (
            <Marker key={business.id} position={[business.lat, business.lng]}>
              <Tooltip>
                <div style={{ maxWidth: '200px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>{business.name}</h3>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                    <strong>Dirección:</strong> {business.location.address}, {business.location.city}
                  </p>
                  <p style={{ margin: '0', fontSize: '14px' }}>
                    <strong>Precio:</strong> {'$'.repeat(business.price_level)}
                  </p>
                </div>
              </Tooltip>
            </Marker>
          )
        ))}
      </MapContainer>
      
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #A08058',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '10px', color: '#573F23', fontSize: '14px' }}>
            Cargando mapa...
          </p>
        </div>
      )}
    </div>
  )
}

export default MapComponent
