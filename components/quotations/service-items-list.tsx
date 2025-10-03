"use client";

import { format, parseISO } from "date-fns";
import { Car, Plane, Package, ChevronDown, PencilIcon, Copy, Trash, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { ServiceCard } from "@/components/quotations/service-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ServiceItemInput, PricingPackage } from "@/types/quotations";

interface ServiceItemsListProps {
  items: ServiceItemInput[];
  mode: "compact" | "expanded";
  t: (key: string) => string;
  expandedServices?: Set<number>;
  onToggleExpanded?: (index: number) => void;
  formatCurrency: (amount: number) => string;
  onEdit: (index: number) => void;
  onDuplicate: (index: number) => void;
  onRemove: (index: number) => void;
  onPriceChange: (index: number, newPrice: number) => void;
  packages: PricingPackage[];
  selectedPackage: PricingPackage | null;
  editingIndex: number | null;
}

export function ServiceItemsList({
  items,
  mode,
  t,
  expandedServices,
  onToggleExpanded,
  formatCurrency,
  onEdit,
  onDuplicate,
  onRemove,
  onPriceChange,
  packages,
  selectedPackage,
  editingIndex,
}: ServiceItemsListProps) {
  if (mode === "expanded") {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Car className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">{t("quotations.form.services.noServicesAddedYet")}</p>
        </div>
      );
    }

    return (
      <div className="space-y-2 sm:space-y-3">
        {items.map((item, index) => {
          const originalPrice = item.unit_price;
          return (
            <ServiceCard
              key={index}
              item={item}
              index={index}
              formatCurrency={formatCurrency}
              packages={packages}
              selectedPackage={selectedPackage}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onRemove={onRemove}
              onPriceChange={onPriceChange}
              isEditing={editingIndex === index}
              showActions={true}
              originalPrice={originalPrice}
            />
          );
        })}

        <div className="pt-2 pb-3 sm:pb-4 flex justify-between items-center font-medium text-sm">
          <span>{t("quotations.form.services.totalAmountBeforeDiscountTax")}</span>
          <span>
            {formatCurrency(
              items.reduce((total, item) => {
                if (item.service_type_name?.toLowerCase().includes("charter")) {
                  const calculatedTotal = item.unit_price * (item.service_days || 1);
                  return total + calculatedTotal;
                }
                return total + (item.total_price || item.unit_price);
              }, 0)
            )}
          </span>
        </div>
      </div>
    );
  }

  // Compact mode
  if (items.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Car className="mx-auto h-6 w-6 mb-2 opacity-50" />
        <p className="text-sm">{t("quotations.form.services.noServicesAddedYet")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const isCharter = item.service_type_name?.toLowerCase().includes("charter") || false;
        const totalPrice = isCharter
          ? item.unit_price * (item.service_days || 1)
          : (item.total_price || item.unit_price);

        const hasTimeAdjustment = item.time_based_adjustment && item.time_based_adjustment !== 0;
        const timeAdjustmentText = hasTimeAdjustment
          ? `${item.time_based_adjustment! > 0 ? "+" : ""}${item.time_based_adjustment}%`
          : "";

        const isExpanded = expandedServices?.has(index) ?? false;

        return (
          <div key={index} className="space-y-2">
            <div
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-all duration-300 cursor-pointer group hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]"
              onClick={() => onToggleExpanded && onToggleExpanded(index)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                <div className="flex-shrink-0">
                  {isCharter ? (
                    <Car className="h-4 w-4 text-blue-600" />
                  ) : item.service_type_name?.toLowerCase().includes("airport") ? (
                    <Plane className="h-4 w-4 text-green-600" />
                  ) : (
                    <Package className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{item.service_type_name}</div>
                  <div className="text-xs text-muted-foreground truncate">{item.vehicle_type}</div>
                  <div className="text-xs text-muted-foreground truncate mt-1">
                    {item.pickup_date && item.pickup_time &&
                      `${format(parseISO(item.pickup_date), "MMM dd, yyyy")} at ${item.pickup_time}`}
                    {isCharter && item.service_days && item.hours_per_day && (
                      ` • ${item.service_days} days × ${item.hours_per_day}h/day`
                    )}
                    {hasTimeAdjustment && (
                      <span className="text-orange-500 dark:text-orange-400 font-medium">
                        {timeAdjustmentText && ` • ${timeAdjustmentText}`}
                        {item.time_based_rule_name && ` ${item.time_based_rule_name}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <div className="font-semibold text-sm">{formatCurrency(totalPrice)}</div>
                </div>
                <div className="ml-2 transition-all duration-300 ease-in-out">
                  <div
                    className={cn(
                      "transform transition-all duration-300 ease-in-out",
                      isExpanded ? "rotate-180 scale-110" : "rotate-0 scale-100"
                    )}
                  >
                    <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1 ml-7">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(index);
                }}
              >
                <PencilIcon className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(index);
                }}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
              >
                <Trash className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>

            <div
              className={cn(
                "overflow-hidden transition-all duration-500 ease-in-out",
                isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
              )}
            >
              {isExpanded && (
                <div className="ml-7 p-4 bg-muted/20 rounded-lg border border-muted/50 transform transition-all duration-500 ease-in-out animate-in slide-in-from-top-4 fade-in-0 zoom-in-95 delay-100">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Service Type:</span>
                        <p className="font-medium">{item.service_type_name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Vehicle:</span>
                        <p className="font-medium">{item.vehicle_type}</p>
                      </div>
                      {item.pickup_date && item.pickup_time && (
                        <div>
                          <span className="font-medium text-muted-foreground">Date & Time:</span>
                          <p className="font-medium">
                            {format(parseISO(item.pickup_date), "MMM dd, yyyy")} at {item.pickup_time}
                          </p>
                        </div>
                      )}
                      {isCharter && item.service_days && item.hours_per_day && (
                        <div>
                          <span className="font-medium text-muted-foreground">Duration:</span>
                          <p className="font-medium">{item.service_days} days × {item.hours_per_day}h/day</p>
                        </div>
                      )}
                      {item.pickup_location && (
                        <div>
                          <span className="font-medium text-muted-foreground">Pickup Location:</span>
                          <p className="font-medium">{item.pickup_location}</p>
                        </div>
                      )}
                      {item.dropoff_location && (
                        <div>
                          <span className="font-medium text-muted-foreground">Dropoff Location:</span>
                          <p className="font-medium">{item.dropoff_location}</p>
                        </div>
                      )}
                      {item.flight_number && (
                        <div>
                          <span className="font-medium text-muted-foreground">Flight Number:</span>
                          <p className="font-medium">{item.flight_number}</p>
                        </div>
                      )}
                      {item.terminal && (
                        <div>
                          <span className="font-medium text-muted-foreground">Terminal:</span>
                          <p className="font-medium">{item.terminal}</p>
                        </div>
                      )}
                      {item.number_of_passengers && (
                        <div>
                          <span className="font-medium text-muted-foreground">Passengers:</span>
                          <p className="font-medium">{item.number_of_passengers}</p>
                        </div>
                      )}
                      {item.number_of_bags && (
                        <div>
                          <span className="font-medium text-muted-foreground">Bags:</span>
                          <p className="font-medium">{item.number_of_bags}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-muted/50 animate-in slide-in-from-bottom-2 fade-in-0 delay-200">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Unit Price:</span>
                          <span className="font-medium">{formatCurrency(item.unit_price)}</span>
                        </div>
                        {isCharter && item.service_days && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">× {item.service_days} days:</span>
                            <span className="font-medium">{formatCurrency(item.unit_price * item.service_days)}</span>
                          </div>
                        )}
                        {hasTimeAdjustment && (
                          <div className="flex justify-between text-orange-500 dark:text-orange-400">
                            <span>Time Adjustment ({timeAdjustmentText}):</span>
                            <span className="font-medium">
                              {formatCurrency(
                                Math.abs((item.unit_price || 0) * (item.service_days || 1) * ((item.time_based_adjustment || 0) / 100))
                              )}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold text-base pt-2 border-t border-muted/50">
                          <span>Total:</span>
                          <span>{formatCurrency(totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div className="pt-2 pb-1 flex justify-between items-center font-medium text-sm border-t">
        <span>{t("quotations.form.services.totalAmountBeforeDiscountTax")}</span>
        <span>
          {formatCurrency(
            items.reduce((total, item) => {
              if (item.service_type_name?.toLowerCase().includes("charter")) {
                const calculatedTotal = item.unit_price * (item.service_days || 1);
                return total + calculatedTotal;
              }
              return total + (item.total_price || item.unit_price);
            }, 0)
          )}
        </span>
      </div>
    </div>
  );
}


