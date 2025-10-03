"use client";

import { UseFormReturn } from "react-hook-form";
import { format, parseISO } from "date-fns";
import { Car, Calendar, Settings, Package, Plus, List, Timer, PencilIcon, Copy, Trash, X, ChevronDown, ChevronUp, Eye, EyeOff, Plane } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { ServiceCard } from "@/components/quotations/service-card";
import { useQuotationFormData } from "@/lib/hooks/use-quotation-form-data";
import { useTimeBasedPricing } from "@/lib/hooks/use-time-based-pricing";
import { useServiceTheme } from "@/lib/hooks/use-service-theme";
import { useServiceSelectionData } from "@/lib/hooks/use-service-selection-data";
import { GooglePlaceAutocomplete } from "@/components/bookings/google-place-autocomplete";
import { FlightSearch } from "@/components/bookings/flight-search";
import { useGoogleMaps } from "@/components/providers/google-maps-provider";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { ServiceItemInput, ServiceTypeInfo, PricingCategory, PricingItem, PricingPackage } from "@/types/quotations";

interface ServiceConfigFormProps {
  form: UseFormReturn<any>;
  serviceItems: ServiceItemInput[];
  setServiceItems: (items: ServiceItemInput[]) => void;
  packages: PricingPackage[];
  selectedPackage: PricingPackage | null;
  setSelectedPackage: (pkg: PricingPackage | null) => void;
  allServiceTypes: ServiceTypeInfo[];
  pricingCategories: PricingCategory[];
  pricingItems: PricingItem[];
  formData?: any;
  calculateQuotationAmount: (
    serviceType: string,
    selectedVehicle: { id: string; brand: string; model: string; name: string } | null,
    duration: number,
    discount: number,
    tax: number,
    days: number,
    hoursPerDay?: number,
    dateTime?: Date | string,
    vehicleCategory?: string
  ) => Promise<{ baseAmount: number; dailyRate: number; totalAmount: number; currency: string }>;
  isEditingService: boolean;
  setIsEditingService: (editing: boolean) => void;
  editingIndex: number | null;
  setEditingIndex: (index: number | null) => void;
  showAddServiceForm: boolean;
  setShowAddServiceForm: (show: boolean) => void;
  serviceTimeBasedPricing: boolean;
  setServiceTimeBasedPricing: (enabled: boolean) => void;
  isCalculating: boolean;
  setIsCalculating: (calculating: boolean) => void;
  onEditServiceItem: (index: number) => void;
  onDuplicateServiceItem: (index: number) => void;
  onRemoveServiceItem: (index: number) => void;
  onCustomPriceChange: (index: number, newPrice: number) => void;
  onAddServiceItem: () => void;
  onUpdateServiceItem: (index: number) => void;
  onAddPackage: (pkg: PricingPackage) => void;
  onPackageSelect: (pkg: PricingPackage) => void;
  onPassengerChange: (value: string, onChange: (value: number | null) => void) => void;
  onBagChange: (value: string, onChange: (value: number | null) => void) => void;
}

export function ServiceConfigForm({
  form,
  serviceItems,
  setServiceItems,
  packages,
  selectedPackage,
  setSelectedPackage,
  allServiceTypes,
  pricingCategories,
  pricingItems,
  formData,
  calculateQuotationAmount,
  isEditingService,
  setIsEditingService,
  editingIndex,
  setEditingIndex,
  showAddServiceForm,
  setShowAddServiceForm,
  serviceTimeBasedPricing,
  setServiceTimeBasedPricing,
  isCalculating,
  setIsCalculating,
  onEditServiceItem,
  onDuplicateServiceItem,
  onRemoveServiceItem,
  onCustomPriceChange,
  onAddServiceItem,
  onUpdateServiceItem,
  onAddPackage,
  onPackageSelect,
  onPassengerChange,
  onBagChange,
}: ServiceConfigFormProps) {
  const { t } = useI18n();
  const { isLoaded: isGoogleMapsLoaded, loadError: googleMapsError } = useGoogleMaps();
  const { rules: timeBasedRules, loading: timeBasedRulesLoading, calculateTimeBasedAdjustment } = useTimeBasedPricing();

  const serviceType = form.watch("service_type");
  const vehicleCategory = form.watch("vehicle_category");
  const vehicleType = form.watch("vehicle_type");
  const serviceDays = form.watch("service_days");
  const hoursPerDay = form.watch("hours_per_day");

  const { currentTheme, themeColors, getServiceTheme, getThemeColors } = useServiceTheme(serviceType, allServiceTypes);
  const { getAvailableServiceTypes, getVehicleCategories, getVehicleTypesForCategory, getDurationsForServiceAndVehicle } = useServiceSelectionData(formData, allServiceTypes, pricingCategories, serviceType, vehicleType, vehicleCategory);

  const selectedServiceTypeObject = allServiceTypes.find((st) => st.id === serviceType);

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const renderButtonGroup = (name: string, options: { id: string; name: string }[], disabled?: boolean) => {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                {options.map((option) => (
                  <Button
                    key={option.id}
                    type="button"
                    variant={field.value === option.id ? "default" : "outline"}
                    onClick={() => field.onChange(option.id)}
                    className={cn("h-auto py-3 px-3 flex flex-col items-center justify-center text-center transition-all text-sm", field.value === option.id ? "ring-2 ring-primary" : "")}
                    disabled={disabled}
                  >
                    <span className="font-medium break-words">{option.name}</span>
                  </Button>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const renderVehicleTypeButtons = (name: string, options: string[], disabled?: boolean) => {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div className="grid grid-cols-1 gap-2 pt-1">
                {options.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={field.value === option ? "default" : "outline"}
                    onClick={() => field.onChange(option)}
                    className={cn("h-auto py-3 px-3 flex items-center justify-center text-center transition-all text-sm", field.value === option ? "ring-2 ring-primary" : "")}
                    disabled={disabled}
                  >
                    <span className="font-medium break-words">{option}</span>
                  </Button>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const renderHoursPerDayButtons = (name: string, options: number[], disabled?: boolean) => {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
                {options.map((duration) => (
                  <Button
                    key={duration}
                    type="button"
                    variant={field.value === duration ? "default" : "outline"}
                    onClick={() => field.onChange(duration)}
                    className={cn("h-auto py-2 px-2 flex flex-col items-center justify-center text-center transition-all text-xs", field.value === duration ? "ring-2 ring-primary" : "")}
                    disabled={disabled}
                  >
                    <span className="font-medium">{duration}h</span>
                  </Button>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Car className="h-5 w-5" />
          {t("quotations.form.serviceSection")}
        </h2>
        {serviceItems.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddServiceForm(!showAddServiceForm)}
              className="text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {showAddServiceForm ? "Hide Form" : "Add Service"}
            </Button>
          </div>
        )}
      </div>

      {/* Service Selection Form - Show when no services, when explicitly requested, or when editing */}
      {(serviceItems.length === 0 || showAddServiceForm || isEditingService) && (
        <div id="service-form-section" className={cn("space-y-4 rounded-lg border p-3 sm:p-4", serviceItems.length > 0 && "bg-muted/20")}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium">
              {isEditingService
                ? t("quotations.form.services.editService")
                : serviceItems.length > 0
                  ? t("quotations.form.services.addAnotherService")
                  : t("quotations.form.services.configureService")}
            </h3>
            {serviceItems.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (isEditingService) {
                    setIsEditingService(false);
                    setEditingIndex(null);
                    form.setValue("service_type", "");
                    form.setValue("vehicle_category", "");
                    form.setValue("vehicle_type", "");
                    form.setValue("service_days", 1);
                    form.setValue("hours_per_day", undefined);
                    form.setValue("pickup_date", undefined);
                    form.setValue("pickup_time", "");
                    form.setValue("pickup_location", "");
                    form.setValue("dropoff_location", "");
                    form.setValue("number_of_passengers", null);
                    form.setValue("number_of_bags", null);
                    form.setValue("flight_number", "");
                  } else {
                    setShowAddServiceForm(false);
                  }
                }}
                className="h-8 px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Service or Package Selection */}
          <div className="space-y-4 sm:space-y-6">
            {/* Individual Services Option */}
            <Card
              className={cn(
                "cursor-pointer transition-all duration-300 hover:shadow-md border-2",
                !selectedPackage ? `${themeColors.primaryBorder} ${themeColors.primaryBg}` : `border-gray-200 ${themeColors.primaryHover}`
              )}
              onClick={(e) => {
                e.preventDefault();
                setSelectedPackage(null);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-lg transition-colors duration-300",
                        currentTheme === "airport"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : currentTheme === "charter"
                            ? "bg-blue-100 dark:bg-blue-900/30"
                            : "bg-gray-100 dark:bg-gray-900/30"
                      )}
                    >
                      <Settings className={cn("h-5 w-5 transition-colors duration-300", themeColors.primaryIcon)} />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">{t("quotations.form.services.individual")}</h4>
                      <p className="text-sm text-muted-foreground">{t("quotations.form.services.configure")}</p>
                    </div>
                  </div>
                  {!selectedPackage && (
                    <Badge variant="default" className={cn("text-xs px-3 py-1 transition-colors duration-300", themeColors.primaryBadge)}>
                      {t("quotations.form.services.active")}
                    </Badge>
                  )}
                </div>

                {!selectedPackage && (
                  <div className={cn("space-y-4 p-2 sm:p-3 md:p-4 rounded-lg border transition-all duration-300", themeColors.primaryCard, themeColors.primaryCardBorder)}>
                    {/* Service Configuration */}
                    <div className="space-y-3 sm:space-y-4" data-service-config>
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="service_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">{t("quotations.form.services.serviceType")}</FormLabel>
                              <FormControl>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                                  {getAvailableServiceTypes().map((option: any) => {
                                    const isSelected = field.value === option.id;
                                    const serviceTheme = getServiceTheme(option.id);
                                    const serviceColors = getThemeColors(serviceTheme);

                                    return (
                                      <Button
                                        key={option.id}
                                        type="button"
                                        variant={isSelected ? "default" : "outline"}
                                        onClick={() => field.onChange(option.id)}
                                        className={cn(
                                          "h-auto py-3 px-3 flex flex-col items-center justify-center text-center transition-all duration-300 text-sm min-h-[60px] sm:min-h-[70px]",
                                          isSelected ? `${serviceColors.primaryButton} text-white shadow-md` : `hover:${serviceColors.primaryCard} hover:${serviceColors.primaryCardBorder}`
                                        )}
                                      >
                                        <span className="font-medium break-words leading-tight px-1">{option.name}</span>
                                      </Button>
                                    );
                                  })}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {serviceType && (
                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name="vehicle_category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">{t("quotations.form.services.vehicleCategory")}</FormLabel>
                                <FormControl>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                                    {getVehicleCategories().map((option: any) => (
                                      <Button
                                        key={option.id}
                                        type="button"
                                        variant={field.value === option.id ? "default" : "outline"}
                                        onClick={() => field.onChange(option.id)}
                                        className={cn(
                                          "h-auto py-3 px-2 sm:px-3 flex flex-col items-center justify-center text-center transition-all text-sm min-h-[50px] sm:min-h-[60px]",
                                          field.value === option.id ? "ring-2 ring-primary" : ""
                                        )}
                                      >
                                        <span className="font-medium break-words text-xs sm:text-sm leading-tight">{option.name}</span>
                                      </Button>
                                    ))}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {vehicleCategory && (
                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name="vehicle_type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">{t("quotations.form.services.vehicleType")}</FormLabel>
                                <FormControl>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                    {getVehicleTypesForCategory().map((option: any, index: number) => (
                                      <Button
                                        key={option.id || `vehicle-${index}`}
                                        type="button"
                                        variant={(field.value && typeof field.value === "object" ? field.value.id === option.id : field.value === option.id) ? "default" : "outline"}
                                        onClick={() => field.onChange(option)}
                                        className={cn(
                                          "h-auto py-3 px-3 flex flex-col items-center justify-center text-center transition-all text-sm min-h-[70px] sm:min-h-[80px]",
                                          (field.value && typeof field.value === "object" ? field.value.id === option.id : field.value === option.id) ? "ring-2 ring-primary" : ""
                                        )}
                                      >
                                        <span className="font-medium break-words text-center px-1">
                                          <div className="font-semibold text-sm sm:text-base leading-tight">{`${option.brand} ${option.model}`}</div>
                                          {option.name && <div className="text-xs text-muted-foreground mt-1 leading-tight">{option.name}</div>}
                                        </span>
                                      </Button>
                                    ))}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {/* SERVICE DATE & TIME - UNDER SERVICES */}
                    {serviceType && vehicleCategory && vehicleType && (
                      <div className={cn("pt-3 sm:pt-4 border-t transition-colors duration-300", themeColors.primaryCardBorder)} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 mb-2 sm:mb-3">
                          <Calendar className={cn("h-4 w-4 transition-colors duration-300", themeColors.primaryIcon)} />
                          <Label className="text-sm font-medium">{t("quotations.form.services.serviceDateTime")}</Label>
                        </div>
                        <FormField
                          control={form.control}
                          name="pickup_date"
                          render={({ field: dateField }) => (
                            <FormField
                              control={form.control}
                              name="pickup_time"
                              render={({ field: timeField }) => (
                                <FormItem>
                                  <FormControl>
                                    <DateTimePicker
                                      date={dateField.value}
                                      time={timeField.value}
                                      onDateChange={dateField.onChange}
                                      onTimeChange={timeField.onChange}
                                      dateLabel={t("quotations.form.services.date")}
                                      timeLabel={t("quotations.form.services.time")}
                                      datePlaceholder={t("quotations.form.services.pickDate")}
                                      timePlaceholder={t("quotations.form.services.selectTime")}
                                      required
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        />

                        {/* Duration for Charter Services */}
                        {selectedServiceTypeObject?.name.toLowerCase().includes("charter") && (
                          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 mt-2 sm:mt-3 items-end">
                            <FormField
                              control={form.control}
                              name="service_days"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Days</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={30}
                                      placeholder="1"
                                      className="text-base h-10"
                                      {...field}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === "") {
                                          field.onChange(1);
                                        } else {
                                          const numValue = parseInt(value, 10);
                                          if (!isNaN(numValue) && numValue >= 1 && numValue <= 30) {
                                            field.onChange(numValue);
                                          }
                                        }
                                      }}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex flex-col">
                              <Label className="text-sm font-medium mb-2 block">{t("quotations.form.services.hoursPerDay")}</Label>
                              {renderHoursPerDayButtons("hours_per_day", getDurationsForServiceAndVehicle())}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Location and Flight Information */}
                    <div className={cn("mt-4 sm:mt-6 pt-4 border-t transition-colors duration-300", themeColors.primaryCardBorder)}>
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <Settings className={cn("h-4 w-4 transition-colors duration-300", themeColors.primaryIcon)} />
                        <Label className="text-sm font-medium">{t("quotations.form.services.locationAndFlight")}</Label>
                      </div>

                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="pickup_location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("quotations.form.services.pickupLocation")}</FormLabel>
                              <FormControl>
                                {isGoogleMapsLoaded && !googleMapsError ? (
                                  <GooglePlaceAutocomplete
                                    id="pickup_location"
                                    name="pickup_location"
                                    label=""
                                    value={field.value || ""}
                                    onChange={(name, value) => field.onChange(value)}
                                    placeholder={t("quotations.form.services.enterPickupLocation")}
                                    required={false}
                                  />
                                ) : (
                                  <Input placeholder={t("quotations.form.services.enterPickupLocation")} className="text-base h-10" {...field} />
                                )}
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="dropoff_location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("quotations.form.services.dropoffLocation")}</FormLabel>
                              <FormControl>
                                {isGoogleMapsLoaded && !googleMapsError ? (
                                  <GooglePlaceAutocomplete
                                    id="dropoff_location"
                                    name="dropoff_location"
                                    label=""
                                    value={field.value || ""}
                                    onChange={(name, value) => field.onChange(value)}
                                    placeholder={t("quotations.form.services.enterDropoffLocation")}
                                    required={false}
                                  />
                                ) : (
                                  <Input placeholder={t("quotations.form.services.enterDropoffLocation")} className="text-base h-10" {...field} />
                                )}
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Flight Information - Only show for Airport Transfer services */}
                      {selectedServiceTypeObject?.name.toLowerCase().includes("airport") && (
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 mt-3 sm:mt-4">
                          <FormField
                            control={form.control}
                            name="flight_number"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("quotations.form.services.flightNumber")}</FormLabel>
                                <FormControl>
                                  <FlightSearch
                                    value={field.value || ""}
                                    onSelect={(flight) => {
                                      if (flight) {
                                        field.onChange(flight.flightNumber);
                                      }
                                    }}
                                    onFlightSelect={(flight) => {
                                      if (flight) {
                                        field.onChange(flight.flightNumber);
                                        if (flight.pickupDate) {
                                          form.setValue("pickup_date", parseISO(flight.pickupDate));
                                        }
                                        if (flight.pickupTime) {
                                          form.setValue("pickup_time", flight.pickupTime);
                                        }
                                        if (flight.arrival?.terminal) {
                                          form.setValue("terminal", flight.arrival.terminal);
                                        }
                                      }
                                    }}
                                    placeholder={t("quotations.form.services.enterFlightNumber")}
                                    label=""
                                    required={false}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="terminal"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("quotations.form.services.terminal")}</FormLabel>
                                <FormControl>
                                  <Input placeholder={t("quotations.form.services.enterTerminal")} className="text-base h-10" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {/* Passenger and Bag Information */}
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 mt-3 sm:mt-4">
                        <FormField
                          control={form.control}
                          name="number_of_passengers"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("quotations.form.services.numberOfPassengers")}</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  max={50}
                                  placeholder={t("quotations.form.services.enterPassengerCount")}
                                  className="text-base h-10"
                                  value={field.value?.toString() || ""}
                                  onChange={(e) => onPassengerChange(e.target.value, field.onChange)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="number_of_bags"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("quotations.form.services.numberOfBags")}</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  max={20}
                                  placeholder={t("quotations.form.services.enterBagCount")}
                                  className="text-base h-10"
                                  value={field.value?.toString() || ""}
                                  onChange={(e) => onBagChange(e.target.value, field.onChange)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Time-based pricing control */}
                    {serviceType && vehicleCategory && vehicleType && (
                      <div className={cn("pt-3 sm:pt-4 border-t transition-colors duration-300", themeColors.primaryCardBorder)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Timer className={cn("h-4 w-4 transition-colors duration-300", themeColors.primaryIcon)} />
                            <Label className="text-sm font-medium">{t("quotations.form.services.applyTimeBasedPricing")}</Label>
                            {serviceTimeBasedPricing && (
                              <Badge variant="outline" className="text-xs">
                                {timeBasedRulesLoading ? t("quotations.form.services.loading") : `${timeBasedRules?.length || 0} ${t("quotations.form.services.rulesActive")}`}
                              </Badge>
                            )}
                          </div>
                          <Switch checked={serviceTimeBasedPricing} onCheckedChange={setServiceTimeBasedPricing} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {serviceTimeBasedPricing ? t("quotations.form.services.servicePricingWillAdjust") : t("quotations.form.services.standardPricingWillBeApplied")}
                        </p>
                      </div>
                    )}

                    {/* Button to add or update service - INSIDE THE SERVICE BLOCK */}
                    <div className={cn("flex flex-col sm:flex-row justify-center gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t transition-colors duration-300", themeColors.primaryCardBorder)}>
                      {isEditingService ? (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              setIsEditingService(false);
                              setEditingIndex(null);
                              form.setValue("service_type", "");
                              form.setValue("vehicle_category", "");
                              form.setValue("vehicle_type", "");
                              form.setValue("service_days", 1);
                              form.setValue("hours_per_day", undefined);
                            }}
                            className="w-full sm:w-auto text-sm"
                          >
                            {t("quotations.form.services.cancelEdit")}
                          </Button>
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              if (editingIndex !== null) {
                                onUpdateServiceItem(editingIndex);
                              } else {
                                onAddServiceItem();
                              }
                              setIsEditingService(false);
                              setEditingIndex(null);
                            }}
                            disabled={!serviceType || !vehicleType}
                            className="w-full sm:w-auto text-sm"
                          >
                            {t("quotations.form.services.updateService")}
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            onAddServiceItem();
                          }}
                          disabled={!serviceType || !vehicleType}
                          className={cn(
                            "w-full text-sm font-medium transition-all duration-300",
                            serviceItems.length === 0 ? `${themeColors.primaryButton} text-white shadow-lg hover:shadow-xl` : `${themeColors.primaryButton} text-white shadow-md hover:shadow-lg`
                          )}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {serviceItems.length === 0 ? t("quotations.form.services.addThisService") : t("quotations.form.services.addAnotherService")}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* OR Separator */}
            {packages.length > 0 && (
              <div className="flex items-center gap-2 sm:gap-4 my-2 sm:my-4">
                <Separator className="flex-1" />
                <span className="text-sm text-muted-foreground font-medium">{t("quotations.form.services.or")}</span>
                <Separator className="flex-1" />
              </div>
            )}

            {/* Package Options */}
            {packages.length > 0 &&
              packages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md border-2",
                    selectedPackage?.id === pkg.id ? "border-purple-500 bg-purple-50/30 dark:bg-purple-900/10" : "border-gray-200 hover:border-purple-300"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    onPackageSelect(pkg);
                  }}
                >
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <Package className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base sm:text-lg font-semibold break-words">{pkg.name}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground break-words">{pkg.description}</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        {selectedPackage?.id === pkg.id && (
                          <Badge variant="default" className="bg-purple-100 text-purple-700 mb-2 text-xs">{t("quotations.form.services.active")}</Badge>
                        )}
                        <p className="font-bold text-lg text-purple-600">{formatCurrency(pkg.base_price)}</p>
                        {pkg.is_featured && <Badge variant="secondary" className="mt-1 text-xs">{t("quotations.form.services.featured")}</Badge>}
                      </div>
                    </div>

                    {selectedPackage?.id === pkg.id && (
                      <div className="space-y-4 p-3 sm:p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                          <Package className="h-4 w-4" />
                          <span className="font-medium text-sm">{t("quotations.form.services.packageIncludes")}</span>
                        </div>

                        {pkg.items && pkg.items.length > 0 ? (
                          <div className="space-y-2">
                            {pkg.items.map((item, index) => (
                              <div key={index} className="flex items-center justify-between bg-white/50 dark:bg-black/20 rounded p-2">
                                <div>
                                  <div className="text-xs font-medium text-purple-800 dark:text-purple-200">{item.name}</div>
                                  <div className="text-xs text-purple-600 dark:text-purple-400">
                                    {item.vehicle_type} • {formatCurrency(item.price)}
                                  </div>
                                </div>
                                {item.quantity > 1 && <Badge variant="outline" className="text-xs">x{item.quantity}</Badge>}
                              </div>
                            ))}
                            <div className="text-xs text-purple-600 dark:text-purple-400 mt-2">• {t("quotations.form.services.timeBasedPricingAdjustments")}</div>
                          </div>
                        ) : (
                          <div className="grid gap-1 text-xs sm:text-sm text-purple-600 dark:text-purple-400">
                            <p>• {t("quotations.form.services.allServicesAtPackageRate")}</p>
                            <p>• {t("quotations.form.services.timeBasedPricingAdjustments")}</p>
                            <p>• {t("quotations.form.services.contactForDetailedBreakdown")}</p>
                          </div>
                        )}

                        {/* PACKAGE DATE & TIME - ONLY FOR SELECTED PACKAGE */}
                        <div className="pt-3 sm:pt-4 border-t border-purple-200 dark:border-purple-800" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2 mb-2 sm:mb-3">
                            <Calendar className="h-4 w-4 text-purple-600" />
                            <Label className="text-sm font-medium">{t("quotations.form.services.packageDateAndTime")}</Label>
                          </div>
                          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 items-end">
                            <FormField
                              control={form.control}
                              name="pickup_date"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>{t("quotations.form.services.date")}</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant={"outline"}
                                          className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Calendar className="mr-2 h-4 w-4" />
                                          {field.value ? format(field.value, "PPP") : <span>{t("quotations.form.services.pickDate")}</span>}
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <CalendarComponent
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="pickup_time"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel> {t("quotations.form.services.time")}</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="time"
                                      className="w-full"
                                      {...field}
                                      value={field.value || ""}
                                      onClick={(e) => e.stopPropagation()}
                                      onFocus={(e) => e.stopPropagation()}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onAddPackage(pkg);
                            }}
                            disabled={!form.watch("pickup_date") || !form.watch("pickup_time")}
                            className="w-full mt-2 sm:mt-3 bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {t("quotations.form.services.addThisPackage")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
