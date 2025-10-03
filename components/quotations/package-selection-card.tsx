"use client";

import { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { Calendar, Package, Plus } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { PricingPackage } from "@/types/quotations";

interface PackageSelectionCardProps {
  form: UseFormReturn<any>;
  packages: PricingPackage[];
  selectedPackage: PricingPackage | null;
  onPackageSelect: (pkg: PricingPackage) => void;
  onAddPackage: (pkg: PricingPackage) => void;
  formatCurrency: (amount: number) => string;
}

export function PackageSelectionCard({
  form,
  packages,
  selectedPackage,
  onPackageSelect,
  onAddPackage,
  formatCurrency,
}: PackageSelectionCardProps) {
  const { t } = useI18n();

  if (packages.length === 0) {
    return null;
  }

  return (
    <>
      {/* OR Separator */}
      <div className="flex items-center gap-2 sm:gap-4 my-2 sm:my-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-sm text-muted-foreground font-medium">{t("quotations.form.services.or")}</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Package Options */}
      {packages.map((pkg) => (
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
                  <Badge variant="default" className="bg-purple-100 text-purple-700 mb-2 text-xs">
                    {t("quotations.form.services.active")}
                  </Badge>
                )}
                <p className="font-bold text-lg text-purple-600">{formatCurrency(pkg.base_price)}</p>
                {pkg.is_featured && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {t("quotations.form.services.featured")}
                  </Badge>
                )}
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
                        {item.quantity > 1 && (
                          <Badge variant="outline" className="text-xs">
                            x{item.quantity}
                          </Badge>
                        )}
                      </div>
                    ))}
                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                      • {t("quotations.form.services.timeBasedPricingAdjustments")}
                    </div>
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
    </>
  );
}
