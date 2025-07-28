import React, { useState, useRef } from 'react';
import { Autocomplete, useLoadScript } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

interface Coordinates {
  lat: number;
  lng: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (
    address: string,
    locationData?: {
      lat: number;
      lng: number;
      place_id: string;
    }
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

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_API_KEY,
    libraries: ['places'],
  });

  const onLoad = (autoC: google.maps.places.Autocomplete) => {
    setAutocomplete(autoC);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      const address = place.formatted_address || place.name || '';
      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();
      const place_id = place.place_id;

      if (lat && lng && place_id) {
        onChange(address, { lat, lng, place_id });
      } else {
        onChange(address); // fallback if place data is incomplete
      }
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
