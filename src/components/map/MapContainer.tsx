"use client"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { MapPin, AlertCircle, Map, Satellite } from "lucide-react"

// Extend the Window interface to include google
declare global {
  interface Window {
    google: any
    initGoogleMapsCallback?: () => void
  }
}

interface MapContainerProps {
  address?: string
  latitude?: number | string
  longitude?: number | string
  showAddressInput?: boolean
  onAddressChange?: (address: string, coords: { lat: number; lng: number; placeId?: string } | null) => void
  height?: string
  showMapTypeToggle?: boolean
}

const AerialMapContainer: React.FC<MapContainerProps> = ({
  address = "",
  latitude,
  longitude,
  showAddressInput = false,
  onAddressChange,
  height = "h-96",
  showMapTypeToggle = true,
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any | null>(null)
  const markerRef = useRef<any | null>(null)
  const geocoderRef = useRef<any | null>(null)
  const initAttemptedRef = useRef(false)
  const [googleApiKey, setGoogleApiKey] = useState<string>("")
  const [isApiKeySet, setIsApiKeySet] = useState(false)
  const [currentAddress, setCurrentAddress] = useState(address)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [mapStatus, setMapStatus] = useState<string>("Not started")
  const [mapType, setMapType] = useState<"satellite" | "hybrid" | "roadmap" | "terrain">("hybrid")

  // Helper function to safely convert to number
  const toNumber = (value: number | string | undefined): number | null => {
    if (value === undefined || value === null || value === "") return null
    const num = typeof value === "string" ? Number.parseFloat(value) : value
    return Number.isFinite(num) ? num : null
  }

  // Helper function to validate coordinates
  const validateCoordinates = (lat: number | string | undefined, lng: number | string | undefined) => {
    const numLat = toNumber(lat)
    const numLng = toNumber(lng)

    if (numLat === null || numLng === null) {
      return { isValid: false, lat: null, lng: null }
    }

    const isValidLat = numLat >= -90 && numLat <= 90
    const isValidLng = numLng >= -180 && numLng <= 180
    const isValid = isValidLat && isValidLng

    return {
      isValid,
      lat: isValid ? numLat : null,
      lng: isValid ? numLng : null,
    }
  }

  // Check for API key on mount
  useEffect(() => {
    const storedApiKey = import.meta.env.VITE_GOOGLE_API_KEY || localStorage.getItem("google_api_key")
    if (storedApiKey) {
      setGoogleApiKey(storedApiKey)
      setIsApiKeySet(true)
    }
  }, [])

  // Initialize map function
  const initializeMap = () => {
    if (initAttemptedRef.current) {
      return
    }

    if (!mapRef.current) {
      setMapStatus("Error: No DOM element")
      return
    }

    if (!window.google?.maps) {
      setMapStatus("Error: Google Maps not loaded")
      return
    }

    initAttemptedRef.current = true
    setMapStatus("Initializing...")

    try {
      // Default location (New York)
      const defaultLocation = { lat: 40.7128, lng: -74.006 }

      // Validate coordinates
      const coordValidation = validateCoordinates(latitude, longitude)
      const hasValidCoords = coordValidation.isValid
      const center =
        hasValidCoords && coordValidation.lat !== null && coordValidation.lng !== null
          ? { lat: coordValidation.lat, lng: coordValidation.lng }
          : defaultLocation
      const zoom = hasValidCoords ? 18 : 12 // Higher zoom for aerial view

      // Create the map with aerial view settings
      const map = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: zoom,
        mapTypeId: window.google.maps.MapTypeId.HYBRID, // Default to hybrid aerial view
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: window.google.maps.ControlPosition.TOP_CENTER,
          mapTypeIds: [
            window.google.maps.MapTypeId.ROADMAP,
            window.google.maps.MapTypeId.SATELLITE,
            window.google.maps.MapTypeId.HYBRID,
            window.google.maps.MapTypeId.TERRAIN,
          ],
        },
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        scaleControl: true,
        rotateControl: true,
        tilt: 0,
      })

      mapInstanceRef.current = map
      geocoderRef.current = new window.google.maps.Geocoder()

      // Add marker if we have valid coordinates
      if (hasValidCoords && coordValidation.lat !== null && coordValidation.lng !== null) {
        // Clear existing marker
        if (markerRef.current) {
          markerRef.current.setMap(null)
        }

        const marker = new window.google.maps.Marker({
          position: { lat: coordValidation.lat, lng: coordValidation.lng },
          map: map,
          title: `Location: ${coordValidation.lat}, ${coordValidation.lng}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: "#FF0000",
            fillOpacity: 0.8,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
        })

        markerRef.current = marker
        setMapStatus("Aerial map and marker created successfully")
      } else {
        setMapStatus("Aerial map created (no marker - invalid coordinates)")
      }
    } catch (error) {
      console.error("Error creating map:", error)
      setMapStatus(`Error: ${error}`)
    }
  }

  // Change map type
  const changeMapType = (newMapType: "satellite" | "hybrid" | "roadmap" | "terrain") => {
    if (mapInstanceRef.current) {
      let googleMapType
      switch (newMapType) {
        case "satellite":
          googleMapType = window.google.maps.MapTypeId.SATELLITE
          break
        case "hybrid":
          googleMapType = window.google.maps.MapTypeId.HYBRID
          break
        case "roadmap":
          googleMapType = window.google.maps.MapTypeId.ROADMAP
          break
        case "terrain":
          googleMapType = window.google.maps.MapTypeId.TERRAIN
          break
        default:
          googleMapType = window.google.maps.MapTypeId.HYBRID
      }

      mapInstanceRef.current.setMapTypeId(googleMapType)
      setMapType(newMapType)
    }
  }

  // Load Google Maps script
  useEffect(() => {
    if (!isApiKeySet || !googleApiKey) {
      setMapStatus("Waiting for API key")
      return
    }

    setMapStatus("Loading Google Maps...")
    initAttemptedRef.current = false

    // Check if already loaded
    if (window.google?.maps) {
      setMapStatus("Google Maps loaded")
      setTimeout(initializeMap, 100)
      return
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      setMapStatus("Script exists, waiting...")
      const pollInterval = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(pollInterval)
          setMapStatus("Google Maps loaded")
          setTimeout(initializeMap, 100)
        }
      }, 100)

      setTimeout(() => {
        clearInterval(pollInterval)
        if (!window.google?.maps) {
          setMapStatus("Timeout waiting for Google Maps")
        }
      }, 10000)
      return
    }

    // Create and load script
    const script = document.createElement("script")

    window.initGoogleMapsCallback = () => {
      setMapStatus("Script loaded via callback")
      setTimeout(initializeMap, 100)
      delete window.initGoogleMapsCallback
    }

    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places&callback=initGoogleMapsCallback`
    script.async = true
    script.defer = true
    script.onerror = () => {
      setMapStatus("Script load failed")
    }

    document.head.appendChild(script)
    setMapStatus("Script added to DOM")

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null)
        markerRef.current = null
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null
      }
    }
  }, [isApiKeySet, googleApiKey, latitude, longitude])

  const geocodeAddress = async (searchAddress: string) => {
    if (!searchAddress.trim() || !geocoderRef.current || !mapInstanceRef.current) return

    setIsGeocoding(true)
    try {
      geocoderRef.current.geocode({ address: searchAddress }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
          const firstResult = results[0]
          const lat = firstResult.geometry.location.lat()
          const lng = firstResult.geometry.location.lng()
          const formattedAddress = firstResult.formatted_address
          const placeId = firstResult.place_id

          mapInstanceRef.current!.setCenter({ lat, lng })
          mapInstanceRef.current!.setZoom(18) // Higher zoom for aerial detail

          if (markerRef.current) {
            markerRef.current.setMap(null)
          }

          markerRef.current = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstanceRef.current!,
            title: formattedAddress,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: "#FF0000",
              fillOpacity: 0.8,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            },
          })

          if (onAddressChange) {
            onAddressChange(formattedAddress, { lat, lng, placeId })
          }
        } else {
          console.error("Geocoding error:", status)
          if (onAddressChange) {
            onAddressChange(searchAddress, null)
          }
        }
        setIsGeocoding(false)
      })
    } catch (error) {
      console.error("Geocoding request error:", error)
      setIsGeocoding(false)
    }
  }

  const handleApiKeySubmit = () => {
    if (googleApiKey.trim()) {
      localStorage.setItem("google_api_key", googleApiKey)
      setIsApiKeySet(true)
    }
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentAddress(e.target.value)
  }

  const handleAddressKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      geocodeAddress(currentAddress)
    }
  }

  if (!isApiKeySet) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-medium">Google Maps API Key Required</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            To display aerial maps and enable address search, please enter your Google Maps API Key. You can get one
            from{" "}
            <a
              href="https://console.cloud.google.com/projectselector2/apis/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google Cloud Console
            </a>
            . Only the Maps JavaScript API and Places API need to be enabled.
          </p>
          <div className="space-y-2">
            <Label htmlFor="google-api-key">Google Maps API Key</Label>
            <div className="flex space-x-2">
              <Input
                id="google-api-key"
                type="text"
                placeholder="AIzaSy..."
                value={googleApiKey}
                onChange={(e) => setGoogleApiKey(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleApiKeySubmit} disabled={!googleApiKey.trim()}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {showAddressInput && (
        <div className="space-y-2">
          <Label htmlFor="address-search">Search Address</Label>
          <div className="relative">
            <Input
              id="address-search"
              type="text"
              placeholder="Enter address to search..."
              value={currentAddress}
              onChange={handleAddressChange}
              onKeyPress={handleAddressKeyPress}
              className="pl-10"
              disabled={isGeocoding}
            />
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            {isGeocoding && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Press Enter to search for the address on the map</p>
        </div>
      )}

      {showMapTypeToggle && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={mapType === "hybrid" ? "default" : "outline"}
            size="sm"
            onClick={() => changeMapType("hybrid")}
            className="flex items-center space-x-1"
          >
            <Satellite className="h-4 w-4" />
            <span>Aerial View</span>
          </Button>
          <Button
            variant={mapType === "satellite" ? "default" : "outline"}
            size="sm"
            onClick={() => changeMapType("satellite")}
            className="flex items-center space-x-1"
          >
            <Satellite className="h-4 w-4" />
            <span>Satellite Only</span>
          </Button>
          <Button
            variant={mapType === "terrain" ? "default" : "outline"}
            size="sm"
            onClick={() => changeMapType("terrain")}
            className="flex items-center space-x-1"
          >
            <Map className="h-4 w-4" />
            <span>Terrain</span>
          </Button>
          <Button
            variant={mapType === "roadmap" ? "default" : "outline"}
            size="sm"
            onClick={() => changeMapType("roadmap")}
            className="flex items-center space-x-1"
          >
            <Map className="h-4 w-4" />
            <span>Road Map</span>
          </Button>
        </div>
      )}

      <Card className="overflow-hidden">
        <div ref={mapRef} className={`w-full ${height} bg-gray-200 relative`} style={{ minHeight: "400px" }}>
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center space-y-2">
              <div>Loading aerial map...</div>
              <div className="text-xs">Status: {mapStatus}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default AerialMapContainer
