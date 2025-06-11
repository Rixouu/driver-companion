"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PencilIcon, Copy, Trash, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { ServiceItemInput, PricingPackage } from '@/types/quotations';

interface ServiceCardProps {
  item: ServiceItemInput;
  index: number;
  formatCurrency: (amount: number) => string;
  packages?: PricingPackage[];
  selectedPackage?: PricingPackage | null;
  onEdit?: (index: number) => void;
  onDuplicate?: (index: number) => void;
  onRemove?: (index: number) => void;
  isEditing?: boolean;
  showActions?: boolean;
  className?: string;
}

export function ServiceCard({
  item,
  index,
  formatCurrency,
  packages = [],
  selectedPackage,
  onEdit,
  onDuplicate,
  onRemove,
  isEditing = false,
  showActions = false,
  className
}: ServiceCardProps) {
  const isPackage = item.is_service_item === false || item.service_type_name?.toLowerCase().includes('package');
  const isCharter = item.service_type_name?.toLowerCase().includes('charter');
  const isTransfer = !isPackage && !isCharter;

  // Calculate time-based adjustment for display
  const baseItemPrice = (item.unit_price || 0) * (item.service_days || 1);
  const timeAdjustmentAmount = item.time_based_adjustment ? 
    baseItemPrice * (item.time_based_adjustment / 100) : 0;

  // Get corresponding package for package items
  const correspondingPackage = isPackage ? 
    (packages.find(pkg => pkg.id === item.service_type_id) || selectedPackage) : null;

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all",
      isEditing && 'ring-2 ring-primary',
      className
    )}>
      <div className={cn(
        "absolute top-0 left-0 h-full w-1",
        isPackage ? 'bg-purple-500' :
        isCharter ? 'bg-blue-500' : 'bg-green-500'
      )} />
      <CardContent className="pt-4 pl-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm sm:text-base flex items-center flex-wrap gap-2">
              <Badge variant={
                isPackage ? "secondary" :
                isCharter ? "default" : "outline"
              } className={cn(
                "text-xs",
                isPackage && "bg-purple-100 text-purple-700 border-purple-200",
                isCharter && "bg-blue-100 text-blue-700 border-blue-200",
                isTransfer && "bg-green-100 text-green-700 border-green-200"
              )}>
                {isPackage ? 'Package' : isCharter ? 'Charter' : 'Transfer'}
              </Badge>
              <span className="break-words">{item.description}</span>
              {isEditing && <Badge variant="outline" className="text-xs">Editing</Badge>}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2 text-xs sm:text-sm">
              {/* For packages, show services included instead of vehicle/duration */}
              {isPackage ? (
                <>
                  <div className="text-muted-foreground">Services Included:</div>
                  <div className="col-span-1 sm:col-span-2">
                    {correspondingPackage && correspondingPackage.items && correspondingPackage.items.length > 0 ? (
                      <div className="space-y-1">
                        {correspondingPackage.items.map((pkgItem: any, pkgIndex: number) => (
                          <div key={pkgIndex} className="text-purple-600 text-xs font-medium">
                            • {pkgItem.name}
                            {pkgItem.vehicle_type && (
                              <span className="text-muted-foreground ml-1">({pkgItem.vehicle_type})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-purple-600 text-xs font-medium">• All package services included</div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* For non-packages, show vehicle information */}
                  <div className="text-muted-foreground">Vehicle:</div>
                  <div className="break-words">{item.vehicle_type}</div>
                  
                  {isCharter ? (
                    <>
                      <div className="text-muted-foreground">Service Duration:</div>
                      <div className="font-medium">
                        {item.service_days} day{item.service_days !== 1 ? 's' : ''} × {item.hours_per_day}h/day
                      </div>
                      <div className="text-muted-foreground">Total Hours:</div>
                      <div className="font-medium text-blue-600">
                        {(item.service_days || 1) * (item.hours_per_day || 1)}h total
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-muted-foreground">Duration:</div>
                      <div>{item.duration_hours} hour(s)</div>
                    </>
                  )}
                </>
              )}
              
              <div className="text-muted-foreground">Unit Price:</div>
              <div>{formatCurrency(item.unit_price)}</div>
              
              {/* Service days multiplier for charter */}
              {isCharter && (item.service_days || 1) > 1 && (
                <>
                  <div className="text-muted-foreground">Days:</div>
                  <div className="text-blue-600">× {item.service_days} days</div>
                </>
              )}
              
              {/* Time-based adjustments */}
              {item.time_based_adjustment && (
                <>
                  <div className="text-muted-foreground">Time Adjustment:</div>
                  <div className="space-y-1">
                    <div className={cn(
                      "font-bold text-sm",
                      item.time_based_adjustment > 0 ? "text-orange-600" : "text-green-600"
                    )}>
                      {item.time_based_adjustment > 0 ? '+' : ''}{formatCurrency(Math.abs(timeAdjustmentAmount))}
                    </div>
                    <div className={cn(
                      "text-xs font-medium",
                      item.time_based_adjustment > 0 ? "text-orange-600" : "text-green-600"
                    )}>
                      ({item.time_based_adjustment > 0 ? '+' : ''}{item.time_based_adjustment}%)
                      {item.time_based_rule_name && (
                        <span className="text-muted-foreground ml-1">
                          - {item.time_based_rule_name}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
              
              {/* Pickup date and time */}
              {(item.pickup_date || item.pickup_time) && (
                <>
                  <div className="text-muted-foreground">Pickup Date:</div>
                  <div>{item.pickup_date ? format(parseISO(item.pickup_date), 'MMM d, yyyy') : 'N/A'}</div>
                  <div className="text-muted-foreground">Pickup Time:</div>
                  <div>{item.pickup_time || 'N/A'}</div>
                </>
              )}
              
              <div className="text-muted-foreground font-medium">Total:</div>
              <div className="font-semibold">{formatCurrency(item.total_price || item.unit_price)}</div>
            </div>
          </div>
          
          {showActions && (
            <div className="flex gap-1 flex-shrink-0">
              {onEdit && (
                <Button 
                  variant={isEditing ? "default" : "ghost"}
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(index);
                  }}
                  title="Edit Service"
                  type="button"
                  className="h-8 w-8"
                >
                  <PencilIcon className="h-3 w-3" />
                </Button>
              )}
              {onDuplicate && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDuplicate(index);
                  }}
                  title="Duplicate Service"
                  disabled={isEditing}
                  type="button"
                  className="h-8 w-8"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}
              {onRemove && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove(index);
                  }}
                  title="Remove Service"
                  disabled={isEditing}
                  type="button"
                  className="h-8 w-8"
                >
                  <Trash className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 