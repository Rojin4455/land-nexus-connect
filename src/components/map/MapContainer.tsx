"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, AlertCircle } from "lucide-react"

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
}

const MapContainer: React.FC<MapContainerProps> = ({
  address = "",
  latitude,
  longitude,
  showAddressInput = false,
  onAddressChange,
  height = "h-96",
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

    console.log("=== COORDINATE VALIDATION ===")
    console.log("Original values:", { lat, lng })
    console.log("Original types:", { lat: typeof lat, lng: typeof lng })
    console.log("Converted values:", { numLat, numLng })

    if (numLat === null || numLng === null) {
      console.log("Validation failed: null values")
      return { isValid: false, lat: null, lng: null }
    }

    const isValidLat = numLat >= -90 && numLat <= 90
    const isValidLng = numLng >= -180 && numLng <= 180

    console.log("Range validation:", { isValidLat, isValidLng })

    const isValid = isValidLat && isValidLng
    console.log("Final validation result:", isValid)

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
    console.log("=== INITIALIZE MAP CALLED ===")
    console.log("mapRef.current:", mapRef.current)
    console.log("window.google:", window.google)
    console.log("initAttemptedRef.current:", initAttemptedRef.current)

    if (initAttemptedRef.current) {
      console.log("Init already attempted, skipping")
      return
    }

    if (!mapRef.current) {
      console.error("Map container DOM element not found")
      setMapStatus("Error: No DOM element")
      return
    }

    if (!window.google?.maps) {
      console.error("Google Maps not available")
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

      const zoom = hasValidCoords ? 15 : 10

      console.log("Creating map with center:", center, "zoom:", zoom)

      // Create the map
      const map = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })

      mapInstanceRef.current = map
      geocoderRef.current = new window.google.maps.Geocoder()

      console.log("Map created successfully")

      // Add marker if we have valid coordinates
      if (hasValidCoords && coordValidation.lat !== null && coordValidation.lng !== null) {
        console.log("Adding marker at:", coordValidation.lat, coordValidation.lng)

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
            scale: 10,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
        })

        markerRef.current = marker
        setMapStatus("Map and marker created successfully")
        console.log("Marker created successfully")
      } else {
        setMapStatus("Map created (no marker - invalid coordinates)")
        console.log("No marker created - invalid coordinates")
      }
    } catch (error) {
      console.error("Error creating map:", error)
      setMapStatus(`Error: ${error}`)
    }
  }

  // Load Google Maps script
  useEffect(() => {
    if (!isApiKeySet || !googleApiKey) {
      setMapStatus("Waiting for API key")
      return
    }

    console.log("=== LOADING GOOGLE MAPS SCRIPT ===")
    setMapStatus("Loading Google Maps...")

    // Reset init attempted when coordinates change
    initAttemptedRef.current = false

    // Check if already loaded
    if (window.google?.maps) {
      console.log("Google Maps already loaded")
      setMapStatus("Google Maps loaded")
      // Use setTimeout to ensure DOM is ready
      setTimeout(initializeMap, 100)
      return
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      console.log("Script already exists, waiting...")
      setMapStatus("Script exists, waiting...")

      // Poll for availability
      const pollInterval = setInterval(() => {
        if (window.google?.maps) {
          console.log("Google Maps became available")
          clearInterval(pollInterval)
          setMapStatus("Google Maps loaded")
          setTimeout(initializeMap, 100)
        }
      }, 100)

      // Stop polling after 10 seconds
      setTimeout(() => {
        clearInterval(pollInterval)
        if (!window.google?.maps) {
          setMapStatus("Timeout waiting for Google Maps")
        }
      }, 10000)
      return
    }

    // Create and load script
    console.log("Creating new script element")
    const script = document.createElement("script")

    // Set up global callback
    window.initGoogleMapsCallback = () => {
      console.log("Global callback triggered")
      setMapStatus("Script loaded via callback")
      setTimeout(initializeMap, 100)
      delete window.initGoogleMapsCallback
    }

    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places&callback=initGoogleMapsCallback`
    script.async = true
    script.defer = true

    script.onerror = () => {
      console.error("Script failed to load")
      setMapStatus("Script load failed")
    }

    document.head.appendChild(script)
    setMapStatus("Script added to DOM")

    return () => {
      // Cleanup
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
          mapInstanceRef.current!.setZoom(15)

          if (markerRef.current) {
            markerRef.current.setMap(null)
          }

          markerRef.current = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstanceRef.current!,
            title: formattedAddress,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#4285F4",
              fillOpacity: 1,
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
            To display maps and enable address search, please enter your Google Maps API Key. You can get one from{" "}
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
              <button
                onClick={handleApiKeySubmit}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                disabled={!googleApiKey.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Get current coordinate validation for debug display
  const coordValidation = validateCoordinates(latitude, longitude)

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

      <Card className="overflow-hidden">
        <div ref={mapRef} className={`w-full ${height} bg-gray-200 relative`} style={{ minHeight: "400px" }}>
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center space-y-2">
              <div>Loading map...</div>
              <div className="text-xs">Status: {mapStatus}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Enhanced Debug info */}
      {/* <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
        <strong>Debug Info:</strong>
        <br />
        Original Coordinates: Lat: {latitude || "undefined"} ({typeof latitude}), Lng: {longitude || "undefined"} (
        {typeof longitude})<br />
        Converted Coordinates:{" "}
        {coordValidation.isValid
          ? `${coordValidation.lat?.toFixed(6)}, ${coordValidation.lng?.toFixed(6)}`
          : "Invalid coordinates"}
        <br />
        Coordinates Valid: {coordValidation.isValid.toString()}
        <br />
        API Key Set: {isApiKeySet.toString()}
        <br />
        Google Maps Loaded: {typeof window !== "undefined" && window.google?.maps ? "Yes" : "No"}
        <br />
        Map Instance: {mapInstanceRef.current ? "Created" : "Not created"}
        <br />
        Marker: {markerRef.current ? "Created" : "Not created"}
        <br />
        Status: {mapStatus}
        <br />
        Init Attempted: {initAttemptedRef.current.toString()}
      </div> */}
    </div>
  )
}

export default MapContainer
