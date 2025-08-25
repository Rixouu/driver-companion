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

interface Driver {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
}

interface DriverSelectorProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function DriverSelector({
  value,
  onValueChange,
  placeholder = "Select a driver",
  disabled = false
}: DriverSelectorProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchDrivers() {
      try {
        const { data, error } = await supabase
          .from('drivers')
          .select('id, first_name, last_name, email, phone')
          .order('first_name')

        if (error) throw error
        setDrivers(data || [])
      } catch (error) {
        console.error('Error fetching drivers:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDrivers()
  }, [])

  const selectedDriver = drivers.find((driver) => driver.id === value)

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
          {selectedDriver ? (
            <span>
              {selectedDriver.first_name} {selectedDriver.last_name}
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search drivers..." />
          <CommandEmpty>No drivers found.</CommandEmpty>
          <CommandGroup>
            {drivers.map((driver) => (
              <CommandItem
                key={driver.id}
                value={driver.id}
                onSelect={() => {
                  onValueChange(driver.id)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === driver.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span className="font-medium">
                    {driver.first_name} {driver.last_name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {driver.email}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
