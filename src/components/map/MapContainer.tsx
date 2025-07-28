import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, AlertCircle } from 'lucide-react';

// Extend the Window interface to include google
declare global {
  interface Window {
    google: any;
  }
}

interface MapContainerProps {
  address?: string;
  latitude?: number;
  longitude?: number;
  showAddressInput?: boolean;
  onAddressChange?: (address: string, coords: { lat: number; lng: number; placeId?: string } | null) => void;
  height?: string;
}

const MapContainer: React.FC<MapContainerProps> = ({
  address = '',
  latitude,
  longitude,
  showAddressInput = false,
  onAddressChange,
  height = 'h-96'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<any>(null); // AdvancedMarkerElement
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const [googleApiKey, setGoogleApiKey] = useState<string>('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(address);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Check for API key on mount
  useEffect(() => {
    const storedApiKey = import.meta.env.VITE_GOOGLE_API_KEY || localStorage.getItem('google_api_key');
    if (storedApiKey) {
      setGoogleApiKey(storedApiKey);
      setIsApiKeySet(true);
    }
  }, []);

  // Main effect to initialize and update map
  useEffect(() => {
    if (!isApiKeySet || !googleApiKey) return;

    // Load Google Maps script if not already loaded
    if (!window.google || !window.google.maps) {
      const script = document.createElement('script');
      // Important: Include 'marker' library for AdvancedMarkerElement
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places,marker`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      if (!mapRef.current) return;

      // Default coordinates (center of US) as fallback
      const defaultLocation = { lat: 39.8283, lng: -98.5795 };
      
      // Determine initial location based on props
      const hasValidCoords = typeof latitude === 'number' && Number.isFinite(latitude) &&
                            typeof longitude === 'number' && Number.isFinite(longitude);
      
      const initialLocation = hasValidCoords 
        ? { lat: latitude, lng: longitude }
        : defaultLocation;

      const initialZoom = hasValidCoords ? 15 : 4;

      console.log('Initializing map with location:', initialLocation, 'zoom:', initialZoom);

      const map = new window.google.maps.Map(mapRef.current, {
        center: initialLocation,
        zoom: initialZoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        // Map ID is required for AdvancedMarkerElement
        mapId: 'DEMO_MAP_ID'
      });

      mapInstanceRef.current = map;
      geocoderRef.current = new window.google.maps.Geocoder();

      // Add marker if we have valid coordinates
      if (hasValidCoords) {
        console.log('Adding marker at:', latitude, longitude);
        
        // Remove existing marker
        if (markerRef.current) {
          markerRef.current.map = null;
          markerRef.current = null;
        }

        // Check if AdvancedMarkerElement is available
        if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
          // Use new AdvancedMarkerElement
          markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
            map: map,
            position: { lat: latitude, lng: longitude },
            title: `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          });
          console.log('AdvancedMarkerElement created successfully');
        } else {
          // Fallback to legacy Marker (should still work even if deprecated)
          markerRef.current = new window.google.maps.Marker({
            position: { lat: latitude, lng: longitude },
            map: map,
            title: `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: 'white',
              strokeWeight: 2,
            },
          });
          console.log('Legacy Marker created successfully');
        }
      } else {
        // Remove marker if coordinates are invalid
        if (markerRef.current) {
          if (markerRef.current.map !== undefined) {
            // AdvancedMarkerElement
            markerRef.current.map = null;
          } else {
            // Legacy Marker
            markerRef.current.setMap(null);
          }
          markerRef.current = null;
        }
      }
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
      if (markerRef.current) {
        if (markerRef.current.map !== undefined) {
          // AdvancedMarkerElement
          markerRef.current.map = null;
        } else {
          // Legacy Marker
          markerRef.current.setMap(null);
        }
        markerRef.current = null;
      }
    };
  }, [isApiKeySet, googleApiKey, latitude, longitude]);

  const geocodeAddress = async (searchAddress: string) => {
    if (!searchAddress.trim() || !geocoderRef.current || !mapInstanceRef.current) return;

    setIsGeocoding(true);
    try {
      geocoderRef.current.geocode({ address: searchAddress }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results && results.length > 0) {
          const firstResult = results[0];
          const lat = firstResult.geometry.location.lat();
          const lng = firstResult.geometry.location.lng();
          const formattedAddress = firstResult.formatted_address;
          const placeId = firstResult.place_id;

          // Update map center and zoom
          mapInstanceRef.current!.setCenter({ lat, lng });
          mapInstanceRef.current!.setZoom(15);

          // Remove existing marker
          if (markerRef.current) {
            if (markerRef.current.map !== undefined) {
              // AdvancedMarkerElement
              markerRef.current.map = null;
            } else {
              // Legacy Marker
              markerRef.current.setMap(null);
            }
            markerRef.current = null;
          }

          // Create new marker
          if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
            markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
              map: mapInstanceRef.current!,
              position: { lat, lng },
              title: formattedAddress,
            });
          } else {
            markerRef.current = new window.google.maps.Marker({
              position: { lat, lng },
              map: mapInstanceRef.current!,
              title: formattedAddress,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#3b82f6',
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 2,
              },
            });
          }

          // Call callback with new address and coordinates
          if (onAddressChange) {
            onAddressChange(formattedAddress, { lat, lng, placeId });
          }
        } else {
          console.error('Geocoding error:', status);
          if (onAddressChange) {
            onAddressChange(searchAddress, null);
          }
        }
        setIsGeocoding(false);
      });
    } catch (error) {
      console.error('Geocoding request error:', error);
      setIsGeocoding(false);
    }
  };

  const handleApiKeySubmit = () => {
    if (googleApiKey.trim()) {
      localStorage.setItem('google_api_key', googleApiKey);
      setIsApiKeySet(true);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentAddress(e.target.value);
  };

  const handleAddressKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      geocodeAddress(currentAddress);
    }
  };

  if (!isApiKeySet) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-medium">Google Maps API Key Required</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            To display maps and enable address search, please enter your Google Maps API Key.
            You can get one from{' '}
            <a
              href="https://console.cloud.google.com/projectselector2/apis/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google Cloud Console
            </a>
            . Ensure Maps JavaScript API and Geocoding API are enabled for your project.
            <br />
            <strong>Important:</strong> As of February 2024, Google deprecated the old Marker class. 
            This component now uses AdvancedMarkerElement which requires the "marker" library.
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
    );
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
          <p className="text-xs text-muted-foreground">
            Press Enter to search for the address on the map
          </p>
        </div>
      )}

      <Card className="overflow-hidden">
        <div 
          ref={mapRef}
          className={`w-full ${height} bg-gray-200 relative`}
          style={{ minHeight: '400px' }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            Loading map...
          </div>
        </div>
      </Card>
      
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-2">
          Debug: Lat: {latitude}, Lng: {longitude}, API Key Set: {isApiKeySet.toString()}
          <br />
          Google Maps Available: {typeof window !== 'undefined' && window.google?.maps ? 'Yes' : 'No'}
          <br />
          AdvancedMarkerElement Available: {typeof window !== 'undefined' && window.google?.maps?.marker?.AdvancedMarkerElement ? 'Yes' : 'No'}
        </div>
      )}
    </div>
  );
};

export default MapContainer;