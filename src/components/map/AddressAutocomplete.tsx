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
  const interactionTimeoutRef = useRef<NodeJS.Timeout>();

  const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY || localStorage.getItem("google_api_key");
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleApiKey || "AIzaSyBGne_zMAku_bLUciu4ko0-MMSg4VG-uHc", // Fallback for development
    libraries,
  });

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
    
    // Set flag immediately when autocomplete loads
    (window as any).__preventModalClose = true;
    console.log('Set __preventModalClose on autocomplete load');
    
    // Set up observer for pac-container styling only
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const pacContainer = document.querySelector('.pac-container') as HTMLElement;
          if (pacContainer) {
            console.log('Styling autocomplete suggestions');
            
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
    console.log('onPlaceChanged triggered!');
    if (autocomplete) {
      const place = autocomplete.getPlace();
      console.log('Selected place:', place);

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

      // Call onChange with the selected data
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

      // Clear the global flag after form update completes
      setTimeout(() => {
        (window as any).__preventModalClose = false;
        console.log('Cleared __preventModalClose after selection');
      }, 500);
    }
  };

  // Add input event handlers to maintain the flag
  const handleInputFocus = () => {
    (window as any).__preventModalClose = true;
    console.log('Set __preventModalClose on input focus');
  };

  const handleInputBlur = () => {
    // Only clear if no suggestions are visible
    setTimeout(() => {
      const pacContainer = document.querySelector('.pac-container') as HTMLElement;
      if (!pacContainer || pacContainer.offsetHeight === 0 || pacContainer.style.display === 'none') {
        (window as any).__preventModalClose = false;
        console.log('Cleared __preventModalClose on input blur');
      }
    }, 200);
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
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            required={required}
            className={`pl-10 ${className}`}
          />
        </Autocomplete>
      </div>
    </div>
  );
};

export default AddressAutocomplete;
