import React, { useState, useRef, useEffect } from 'react';
import { Autocomplete, useLoadScript } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

// Keep libraries array static to prevent script reloading
const libraries: ("places")[] = ["places"];

// Define full location type
interface LocationData {
  lat: number;
  lng: number;
  place_id: string;
  city?: string | null;
  county?: string | null;
  state?: string | null;
  zip_code?: string | null;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (
    address: string,
    locationData?: LocationData
  ) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Enter address...',
  required = false,
  className = ''
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY || localStorage.getItem("google_api_key");
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleApiKey || "AIzaSyBGne_zMAku_bLUciu4ko0-MMSg4VG-uHc", // Fallback for development
    libraries,
  });
  
  useEffect(() => {
    const info = [];
    info.push(`API Key: ${googleApiKey ? 'Present' : 'Using fallback'}`);
    info.push(`Is Loaded: ${isLoaded}`);
    info.push(`Load Error: ${loadError ? loadError.message : 'None'}`);
    setDebugInfo(info);
    
    if (isLoaded) {
      // Check for pac-container in DOM periodically
      const checkPacContainer = setInterval(() => {
        const pacContainer = document.querySelector('.pac-container');
        if (pacContainer) {
          console.log('Found pac-container:', pacContainer);
          setDebugInfo(prev => [...prev, 'pac-container found in DOM']);
          clearInterval(checkPacContainer);
        }
      }, 500);
      
      return () => clearInterval(checkPacContainer);
    }
  }, [isLoaded, loadError, googleApiKey]);

  if (loadError) {
    console.error('Error loading Google Maps:', loadError);
    return (
      <div className="relative w-full">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className={`pl-10 ${className}`}
          />
        </div>
        <div className="text-xs text-destructive mt-1">
          Google Maps failed to load. Please check your API key.
        </div>
      </div>
    );
  }

  if (!googleApiKey) {
    return (
      <div className="relative w-full">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className={`pl-10 ${className}`}
          />
        </div>
        <div className="text-xs text-warning mt-1">
          Using fallback API key - set VITE_GOOGLE_API_KEY for production
        </div>
      </div>
    );
  }

  const onLoad = (autoC: google.maps.places.Autocomplete) => {
    setAutocomplete(autoC);
    console.log('Autocomplete loaded successfully');
    setDebugInfo(prev => [...prev, 'Autocomplete component loaded']);
    
    // Set up a more robust observer for pac-container
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const pacContainer = document.querySelector('.pac-container') as HTMLElement;
          if (pacContainer) {
            console.log('pac-container detected via MutationObserver');
            setDebugInfo(prev => [...prev, 'pac-container detected and styled']);
            
            // Style the container
            pacContainer.style.position = 'fixed';
            pacContainer.style.zIndex = '99999';
            pacContainer.style.backgroundColor = 'white';
            pacContainer.style.border = '1px solid #ccc';
            pacContainer.style.borderRadius = '6px';
            pacContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            pacContainer.style.pointerEvents = 'auto';
            
            // Position it near the input
            if (inputRef.current) {
              const rect = inputRef.current.getBoundingClientRect();
              pacContainer.style.top = `${rect.bottom + window.scrollY + 2}px`;
              pacContainer.style.left = `${rect.left + window.scrollX}px`;
              pacContainer.style.minWidth = `${rect.width}px`;
            }
            
            observer.disconnect();
          }
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      console.log("place", place);

      const address = place.formatted_address || place.name || '';
      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();
      const place_id = place.place_id;

      // Extract helper
      const getComponent = (type: string) =>
        place.address_components?.find(c => c.types.includes(type))?.long_name || null;

      const city = getComponent("locality");
      const county = getComponent("administrative_area_level_2");
      const state = getComponent("administrative_area_level_1");
      const zip_code = getComponent("postal_code");

      // Prevent any event bubbling that might close modals
      setTimeout(() => {
        if (lat && lng && place_id) {
          onChange(address, {
            lat,
            lng,
            place_id,
            city,
            county,
            state,
            zip_code,
          });
        } else {
          onChange(address); // fallback if no geometry
        }
      }, 0);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className={`pl-10 ${className}`}
          />
        </Autocomplete>
      </div>
      {debugInfo.length > 0 && (
        <div className="text-xs text-muted-foreground mt-1 space-y-1">
          {debugInfo.map((info, index) => (
            <div key={index}>• {info}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
