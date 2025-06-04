"use client"

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Car, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/context";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupabase } from "@/components/providers/supabase-provider";
import type { DbVehicle } from "@/types"; // Assuming DbVehicle is defined in @/types
import { useToast } from "@/components/ui/use-toast";

interface VehicleSelectorProps {
  value: string | null; // Allow null if no vehicle is selected initially
  onChange: (value: string) => void;
  excludedVehicleIds?: string[];
  showAvailableOnly?: boolean;
}

export function VehicleSelector({
  value,
  onChange,
  excludedVehicleIds = [],
  showAvailableOnly = false,
}: VehicleSelectorProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [allVehicles, setAllVehicles] = useState<DbVehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<DbVehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useSupabase();

  const excludedIdsString = useMemo(() => excludedVehicleIds.join(','), [excludedVehicleIds]);

  useEffect(() => {
    async function loadVehicles() {
      setIsLoading(true);
      try {
        let query = supabase
          .from("vehicles")
          .select("*, driver:drivers(id, first_name, last_name)") // Fetch driver info if needed for availability or display
          .order("name", { ascending: true });

        if (excludedVehicleIds.length > 0) {
          query = query.not("id", "in", `(${excludedVehicleIds.join(',')})`);
        }
        
        if (showAvailableOnly) {
          // Assuming 'driver_id' being null means available.
          // If your DbVehicle has a nested driver object, you might query based on that.
          // For this example, let's assume a direct 'driver_id' column on 'vehicles' table.
          query = query.is("driver_id", null);
        }

        const { data, error } = await query;

        if (error) throw error;

        setAllVehicles(data || []);
        setFilteredVehicles(data || []);
      } catch (error) {
        console.error("Error loading vehicles:", error);
        toast({
          title: t("common.error"),
          description: t("vehicles.selector.errors.loadFailed"),
          variant: "destructive",
        });
        setAllVehicles([]);
        setFilteredVehicles([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadVehicles();
  // Depend on excludedIdsString for stability if excludedVehicleIds array identity changes frequently
  }, [supabase, excludedIdsString, showAvailableOnly, t, toast, excludedVehicleIds]); // kept excludedVehicleIds for directness since join is in query now

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredVehicles(allVehicles);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allVehicles.filter(
      (vehicle) =>
        vehicle.name?.toLowerCase().includes(query) ||
        vehicle.plate_number?.toLowerCase().includes(query) ||
        vehicle.brand?.toLowerCase().includes(query) ||
        vehicle.model?.toLowerCase().includes(query)
    );
    setFilteredVehicles(filtered);
  }, [searchQuery, allVehicles]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("vehicles.selector.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          disabled={isLoading}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border rounded-md">
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-5 w-5 rounded-full" /> 
            </div>
          ))}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-muted/30">
          <Car className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-medium mb-1">
            {searchQuery
              ? t("vehicles.selector.noResultsTitle")
              : t("vehicles.selector.noAvailableTitle")}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {searchQuery
              ? t("vehicles.selector.noResultsDescription")
              : t("vehicles.selector.noAvailableDescription")}
          </p>
        </div>
      ) : (
        <RadioGroup
          value={value ?? undefined} // Handle null value for RadioGroup
          onValueChange={onChange}
          className="space-y-3 max-h-[300px] overflow-y-auto pr-2" // Added max-height and scroll
        >
          {filteredVehicles.map((vehicle) => (
            <Label // Using Label as clickable wrapper for better accessibility
              key={vehicle.id}
              htmlFor={vehicle.id}
              className={`flex items-center gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer ${
                value === vehicle.id ? "border-primary bg-primary/5 shadow-md" : "border-border"
              }`}
            >
              {vehicle.image_url ? (
                <div className="relative h-12 w-12 rounded-md overflow-hidden flex-shrink-0">
                  <Image
                    src={vehicle.image_url}
                    alt={vehicle.name ?? t('vehicles.vehicleImageAlt')}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Example sizes
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                  <Car className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate" title={vehicle.name ?? undefined}>{vehicle.name}</div>
                <div className="text-sm text-muted-foreground space-x-1 truncate">
                  <span title={vehicle.plate_number ?? undefined}>{vehicle.plate_number}</span>
                  {vehicle.brand && (
                    <>
                      <span>•</span>
                      <span title={vehicle.brand}>{vehicle.brand}</span>
                    </>
                  )}
                  {vehicle.model && (
                    <>
                      <span>•</span>
                      <span title={vehicle.model}>{vehicle.model}</span>
                    </>
                  )}
                </div>
              </div>
              <RadioGroupItem value={vehicle.id} id={vehicle.id} className="ml-auto flex-shrink-0" />
            </Label>
          ))}
        </RadioGroup>
      )}
    </div>
  );
}
