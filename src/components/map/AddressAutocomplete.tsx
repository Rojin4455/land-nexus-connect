import React, { useState, useRef } from 'react';
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

  const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  
  console.log('Google API Key:', googleApiKey ? 'Present' : 'Missing');
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleApiKey,
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
          Google Maps API key is missing. Address autocomplete is disabled.
        </div>
      </div>
    );
  }

  const onLoad = (autoC: google.maps.places.Autocomplete) => {
    setAutocomplete(autoC);
    
    // Ensure autocomplete works in modals and prevent modal closing
    setTimeout(() => {
      const pacContainer = document.querySelector('.pac-container') as HTMLElement;
      if (pacContainer) {
        pacContainer.style.pointerEvents = 'auto';
        pacContainer.style.zIndex = '10000';
        
        // Prevent modal closing when clicking on suggestions
        pacContainer.addEventListener('click', (e) => {
          e.stopPropagation();
        });
        
        pacContainer.addEventListener('mousedown', (e) => {
          e.stopPropagation();
        });
      }
    }, 100);
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
    </div>
  );
};

export default AddressAutocomplete;
