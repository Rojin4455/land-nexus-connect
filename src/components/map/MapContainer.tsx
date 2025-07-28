import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, AlertCircle } from 'lucide-react';

interface MapContainerProps {
  address?: string;
  latitude?: number;
  longitude?: number;
  showAddressInput?: boolean;
  onAddressChange?: (address: string, coords: { lat: number; lng: number } | null) => void;
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
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [isTokenSet, setIsTokenSet] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(address);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Check for token in localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('mapbox_token');
    if (storedToken) {
      setMapboxToken(storedToken);
      setIsTokenSet(true);
    }
  }, []);

  // Initialize map when token is available
  useEffect(() => {
    if (!isTokenSet || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    // Default coordinates (center of US)
    const defaultLat = latitude || 39.8283;
    const defaultLng = longitude || -98.5795;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [defaultLng, defaultLat],
      zoom: latitude && longitude ? 15 : 4
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add marker if coordinates are provided
    if (latitude && longitude) {
      addMarker(latitude, longitude);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isTokenSet, mapboxToken, latitude, longitude]);

  // Update map when coordinates change
  useEffect(() => {
    if (map.current && latitude && longitude) {
      map.current.flyTo({
        center: [longitude, latitude],
        zoom: 15,
        duration: 1500
      });
      addMarker(latitude, longitude);
    }
  }, [latitude, longitude]);

  const addMarker = (lat: number, lng: number) => {
    if (!map.current) return;

    // Remove existing marker
    if (marker.current) {
      marker.current.remove();
    }

    // Add new marker
    marker.current = new mapboxgl.Marker({
      color: '#3b82f6'
    })
      .setLngLat([lng, lat])
      .addTo(map.current);
  };

  const geocodeAddress = async (searchAddress: string) => {
    if (!searchAddress.trim() || !mapboxToken) return;

    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchAddress
        )}.json?access_token=${mapboxToken}&limit=1`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          const formattedAddress = data.features[0].place_name;
          
          // Update map and marker
          if (map.current) {
            map.current.flyTo({
              center: [lng, lat],
              zoom: 15,
              duration: 1500
            });
            addMarker(lat, lng);
          }

          // Call callback with new address and coordinates
          if (onAddressChange) {
            onAddressChange(formattedAddress, { lat, lng });
          }
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      localStorage.setItem('mapbox_token', mapboxToken);
      setIsTokenSet(true);
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

  if (!isTokenSet) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-medium">Mapbox Token Required</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            To display maps and enable address autocomplete, please enter your Mapbox public token.
            You can get one from{' '}
            <a 
              href="https://account.mapbox.com/access-tokens/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
          </p>
          <div className="space-y-2">
            <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
            <div className="flex space-x-2">
              <Input
                id="mapbox-token"
                type="text"
                placeholder="pk.eyJ1..."
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                className="flex-1"
              />
              <button
                onClick={handleTokenSubmit}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                disabled={!mapboxToken.trim()}
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
        <div ref={mapContainer} className={`w-full ${height}`} />
      </Card>
    </div>
  );
};

export default MapContainer;