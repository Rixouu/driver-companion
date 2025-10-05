'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, AlertCircle } from 'lucide-react'
import { useGoogleMaps } from '@/components/providers/google-maps-provider'

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

  // Re-enable Google Maps autocomplete with a simpler approach
  useEffect(() => {
    // Prevent click events from bubbling up to parent elements (like Sheet close)
    const handleAutocompleteClick = (e: Event) => {
      e.stopPropagation()
    }

    if (isLoaded && inputRef.current && window.google?.maps?.places && !autocompleteRef.current) {
      try {
        console.log("Initializing Google Maps Autocomplete...")
        
        // Create the autocomplete instance
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode'],
          componentRestrictions: { country: 'jp' },
          // Ensure we get the formatted address back from getPlace()
          fields: ['formatted_address', 'geometry.location', 'place_id', 'name'],
        })
        
        // Add place_changed event listener
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          if (place?.formatted_address) {
            onChange(name, place.formatted_address)
          }
        })

        // Add a more direct approach - manually handle pac-item clicks
        const handlePacItemClickDirect = (e: Event) => {
          const target = e.target as Element
          if (target.closest('.pac-item')) {
            e.stopPropagation()
            e.preventDefault()
            
            // Manually trigger the place selection
            const pacItem = target.closest('.pac-item')
            if (pacItem) {
              // Get the text content of the pac-item
              const itemText = pacItem.textContent || (pacItem as HTMLElement).innerText
              if (itemText) {
                // Update the input value
                if (inputRef.current) {
                  inputRef.current.value = itemText
                  onChange(name, itemText)
                }
              }
            }
            return false
          }
        }
        
        // Add the event listener with capture
        document.addEventListener('click', handlePacItemClickDirect, true)
        document.addEventListener('mousedown', handlePacItemClickDirect, true)

        // Add listener for when the dropdown opens to prevent clicks from closing the sheet
        autocomplete.addListener('place_changed', () => {
          // Small delay to ensure the dropdown is rendered
          setTimeout(() => {
            const pacContainer = document.querySelector('.pac-container')
            if (pacContainer) {
              // Add click event listener to prevent bubbling
              pacContainer.addEventListener('click', (e) => {
                e.stopPropagation()
                e.preventDefault()
                return false
              }, true)
              
              // Also prevent mousedown events
              pacContainer.addEventListener('mousedown', (e) => {
                e.stopPropagation()
                e.preventDefault()
                return false
              }, true)
            }
          }, 100)
        })

        // Add a more direct approach - intercept clicks on pac-container items
        const handlePacItemClickGlobal = (e: Event) => {
          if (e.target && (e.target as Element).closest('.pac-container')) {
            e.stopPropagation()
            e.preventDefault()
            return false
          }
        }
        
        // Add the event listener immediately
        document.addEventListener('click', handlePacItemClickGlobal, true)
        document.addEventListener('mousedown', handlePacItemClickGlobal, true)
        
        // Add click event listener to prevent bubbling
        if (inputRef.current) {
          inputRef.current.addEventListener('click', handleAutocompleteClick)
        }
        
        autocompleteRef.current = autocomplete
      } catch (error) {
        console.error('Error initializing Google Maps Autocomplete:', error)
      }
    }
    
    // Cleanup function
    return () => {
      if (autocompleteRef.current && autocompleteRef.current.removeAllListeners) {
        try {
          autocompleteRef.current.removeAllListeners('place_changed')
          autocompleteRef.current = null
        } catch (error) {
          console.error('Error cleaning up autocomplete:', error)
        }
      }
      
      // Clean up click event listener
      if (inputRef.current) {
        inputRef.current.removeEventListener('click', handleAutocompleteClick)
      }
    }
  }, [isLoaded, name, onChange])

  // Handle manual changes to the input (only for fallback)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(name, e.target.value)
  }
  

  


  return (
    <>
      {/* Scoped styles for the new gmp web component variant (kept for consistency) */}
      <style jsx>{`
        gmp-place-autocomplete {
          --gmpx-color-surface: #1f2937 !important;
          --gmpx-color-on-surface: #f9fafb !important;
          --gmpx-color-on-surface-variant: #d1d5db !important;
          --gmpx-color-outline: #374151 !important;
          --gmpx-color-primary: #3b82f6 !important;
        }
        
        gmp-place-autocomplete::part(input) {
          background: #1f2937 !important;
          color: #f9fafb !important;
          border: 1px solid #374151 !important;
        }
        
        gmp-place-autocomplete::part(menu) {
          background: #1f2937 !important;
          border: 1px solid #374151 !important;
        }
        
        gmp-place-autocomplete::part(menu-item) {
          background: #1f2937 !important;
          color: #f9fafb !important;
        }
        
        gmp-place-autocomplete::part(menu-item):hover {
          background: #374151 !important;
        }
      `}</style>
      {/* Global styles to ensure the legacy Places `.pac-container` renders above overlays
          (Radix Dialog/Sheet overlays can otherwise block clicks). */}
      <style jsx global>{`
        .pac-container {
          z-index: 2147483647 !important; /* Always on top */
          pointer-events: auto !important;
          border: 1px solid #374151 !important;
          border-radius: 6px !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          background: #1f2937 !important;
          font-family: inherit !important;
        }
        .pac-container .pac-item {
          background: #1f2937 !important;
          color: #f9fafb !important;
          border: none !important;
          padding: 8px 12px !important;
          font-size: 14px !important;
          line-height: 1.4 !important;
          cursor: pointer !important;
          border-bottom: 1px solid #374151 !important;
        }
        .pac-container .pac-item:last-child {
          border-bottom: none !important;
        }
        .pac-container .pac-item:hover {
          background: #374151 !important;
        }
        .pac-container .pac-item-selected {
          background: #3b82f6 !important;
          color: white !important;
        }
        .pac-container .pac-item-query {
          color: #f9fafb !important;
          font-weight: 500 !important;
        }
        .pac-container .pac-matched {
          color: #60a5fa !important;
          font-weight: 600 !important;
        }
        .pac-container .pac-icon {
          background-image: none !important;
          width: 16px !important;
          height: 16px !important;
          margin-right: 8px !important;
        }
        .pac-container .pac-icon:before {
          content: "📍" !important;
          font-size: 14px !important;
        }
        /* Prevent clicks on autocomplete items from bubbling up */
        .pac-container .pac-item {
          pointer-events: auto !important;
        }
        .pac-container .pac-item * {
          pointer-events: none !important;
        }
      `}</style>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // More aggressive approach to prevent pac-container clicks from closing sheets
            function preventPacContainerBubbling(e) {
              if (e.target.closest('.pac-container')) {
                e.stopPropagation();
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
              }
            }
            
            // Override the default behavior for pac-container clicks
            function handlePacClick(e) {
              if (e.target.closest('.pac-container')) {
                e.stopPropagation();
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
              }
            }
            
            // Add multiple event listeners with highest priority
            const events = ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'pointerdown', 'pointerup'];
            events.forEach(event => {
              document.addEventListener(event, handlePacClick, true);
              document.addEventListener(event, preventPacContainerBubbling, true);
            });
            
            // Also add a mutation observer to catch dynamically added pac-containers
            const observer = new MutationObserver(function(mutations) {
              mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                  mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && node.classList && node.classList.contains('pac-container')) {
                      // Add event listeners to the newly added pac-container
                      events.forEach(event => {
                        node.addEventListener(event, handlePacClick, true);
                        node.addEventListener(event, preventPacContainerBubbling, true);
                      });
                    }
                  });
                }
              });
            });
            
            observer.observe(document.body, {
              childList: true,
              subtree: true
            });
            
            // Additional safety: prevent any clicks on pac-container from reaching the document
            document.addEventListener('click', function(e) {
              if (e.target.closest('.pac-container')) {
                e.stopPropagation();
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
              }
            }, true);
            
            // Override the pac-container's click behavior completely
            const originalPacContainerClick = function() {};
            document.addEventListener('DOMContentLoaded', function() {
              const pacContainers = document.querySelectorAll('.pac-container');
              pacContainers.forEach(container => {
                container.onclick = function(e) {
                  e.stopPropagation();
                  e.preventDefault();
                  e.stopImmediatePropagation();
                  return false;
                };
              });
            });
            
            // Also override any future pac-containers
            const observer = new MutationObserver(function(mutations) {
              mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                  mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && node.classList && node.classList.contains('pac-container')) {
                      node.onclick = function(e) {
                        e.stopPropagation();
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        return false;
                      };
                    }
                  });
                }
              });
            });
            
            observer.observe(document.body, {
              childList: true,
              subtree: true
            });
          `
        }}
      />
      <div className={`space-y-2 ${className}`}>
        <Label htmlFor={id} className="flex items-center">
          {label} {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <div 
          className="relative"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <MapPin className="absolute left-2 top-2.5 h-5 w-5 text-muted-foreground" />
          {!isLoaded || loadError ? (
            // Show regular input if Google Maps is not loaded or has errors
            <Input
              ref={inputRef}
              id={id}
              name={name}
              value={value || ''}
              onChange={handleInputChange}
              placeholder={placeholder}
              className="pl-9"
              required={required}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            // Show the Google Maps autocomplete input
            <Input
              ref={inputRef}
              id={id}
              name={name}
              value={value || ''}
              onChange={handleInputChange}
              placeholder={placeholder}
              className="pl-9"
              required={required}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
          )}
          {loadError && (
            <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-500 mt-1">
              <AlertCircle className="h-3 w-3" />
              <span>{loadError}. Manual address entry is available.</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
} 