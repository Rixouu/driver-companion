'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, AlertCircle } from 'lucide-react'
import { useGoogleMaps } from '@/components/providers/google-maps-provider'

// Simplified type definition for Google Maps
declare global {
  interface Window {
    google: any
    initGoogleMapsCallback: () => void
  }
}

interface GooglePlaceAutocompleteProps {
  id: string
  name: string
  label: string
  value: string
  onChange: (name: string, value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
}

export function GooglePlaceAutocomplete({
  id,
  name,
  label,
  value,
  onChange,
  placeholder = 'Enter location',
  required = false,
  className = '',
}: GooglePlaceAutocompleteProps) {
  const { isLoaded, loadError } = useGoogleMaps()
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)

  // No need for manual Google Maps loading - handled by provider

  useEffect(() => {
    if (isLoaded && inputRef.current && window.google?.maps?.places && !autocompleteRef.current) {
      try {
        console.log("Initializing Google Maps Autocomplete...")
        // Initialize autocomplete with Japan restriction
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode'],
          fields: ['formatted_address', 'geometry', 'name', 'address_components'],
          componentRestrictions: { country: 'jp' } // Restrict to Japan
        })

        // Add listener for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace()
          console.log("Place selected:", place)
          if (place?.formatted_address) {
            onChange(name, place.formatted_address)
          }
        })
        
        console.log("Google Maps Autocomplete initialized successfully")
      } catch (error) {
        console.error('Error initializing Google Maps Autocomplete:', error)
        setLoadError(`Failed to initialize Google Maps autocomplete: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }, [loaded, name, onChange])

  // Handle manual changes to the input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(name, e.target.value)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id} className="flex items-center">
        {label} {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="relative">
        <MapPin className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
        <Input
          ref={inputRef}
          id={id}
          name={name}
          value={value || ''}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`pl-9 ${loadError ? 'border-yellow-300 focus-visible:ring-yellow-300' : ''}`}
          required={required}
        />
        {loadError && (
          <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-500 mt-1">
            <AlertCircle className="h-3 w-3" />
            <span>{loadError}. Manual address entry is available.</span>
          </div>
        )}
      </div>
    </div>
  )
} 