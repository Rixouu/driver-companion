"use client"

import { useEffect, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils/styles"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { createClient } from "@/lib/supabase"
import { useI18n } from "@/lib/i18n/context"
import type { DbVehicle } from "@/types"

interface VehicleSelectorProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function VehicleSelector({
  value,
  onValueChange,
  placeholder = "Select a vehicle",
  disabled = false
}: VehicleSelectorProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [vehicles, setVehicles] = useState<DbVehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchVehicles() {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('id, name, plate_number')
          .order('name')

        if (error) throw error
        setVehicles(data || [])
      } catch (error) {
        console.error('Error fetching vehicles:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVehicles()
  }, [])

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading}
        >
          {selectedVehicle ? (
            <span>
              {selectedVehicle.name} ({selectedVehicle.plate_number})
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={t("vehicles.searchPlaceholder")} />
          <CommandEmpty>{t("vehicles.noVehicles")}</CommandEmpty>
          <CommandGroup>
            {vehicles.map((vehicle) => (
              <CommandItem
                key={vehicle.id}
                value={vehicle.id}
                onSelect={() => {
                  onValueChange(vehicle.id)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === vehicle.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {vehicle.name} ({vehicle.plate_number})
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

