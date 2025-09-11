"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PencilIcon, Copy, Trash, Edit3, Check, X as XIcon } from 'lucide-react';
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
  onPriceChange?: (index: number, newPrice: number) => void;
  isEditing?: boolean;
  showActions?: boolean;
  className?: string;
  originalPrice?: number;
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
  onPriceChange,
  isEditing = false,
  showActions = false,
  className,
  originalPrice
}: ServiceCardProps) {
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [customPrice, setCustomPrice] = useState(item.unit_price?.toString() || '0');
  
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

  // Handle price editing
  const handlePriceEdit = () => {
    setIsEditingPrice(true);
    setCustomPrice(item.unit_price?.toString() || '0');
  };

  const handlePriceSave = () => {
    const newPrice = parseFloat(customPrice);
    if (!isNaN(newPrice) && newPrice >= 0 && onPriceChange) {
      onPriceChange(index, newPrice);
      setIsEditingPrice(false);
    }
  };

  const handlePriceCancel = () => {
    setIsEditingPrice(false);
    setCustomPrice(item.unit_price?.toString() || '0');
  };

  const hasCustomPrice = originalPrice && originalPrice !== item.unit_price;

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all",
      isEditing && 'ring-2 ring-primary',
      className
    )}>
      {/* Color indicator bar */}
      <div className={cn(
        "absolute top-0 left-0 h-full w-1",
        isPackage ? 'bg-purple-500' :
        isCharter ? 'bg-blue-500' : 'bg-green-500'
      )} />
      
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          {/* Header with main info and actions */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm sm:text-base flex items-center flex-wrap gap-2">
                <Badge variant={
                  isPackage ? "secondary" :
                  isCharter ? "default" : "outline"
                } className={cn(
                  "text-xs",
                  isPackage && "bg-purple-100 text-purple-700 border-purple-200",
                  isCharter && "bg-green-100 text-green-700 border-green-200",
                  isTransfer && "bg-blue-100 text-blue-700 border-blue-200"
                )}>
                  {isPackage ? 'Package' : isCharter ? 'Charter' : 'Transfer'}
                </Badge>
                <span className="break-words">{item.description}</span>
                {isEditing && <Badge variant="outline" className="text-xs">Editing</Badge>}
              </h3>
              
              {/* Essential info always visible - compact for mobile */}
              <div className="mt-2 space-y-1 text-xs sm:text-sm">
                {!isPackage && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Vehicle:</span>
                    <span className="break-words font-medium">{item.vehicle_type}</span>
                  </div>
                )}
                
                {/* Price and total - always visible */}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-semibold text-base">{formatCurrency(item.total_price || item.unit_price)}</span>
                </div>
              </div>
            </div>
            
            {/* Action buttons - larger and more touch-friendly */}
            {showActions && (
              <div className="flex gap-1 flex-shrink-0">
                {onEdit && (
                  <Button 
                    variant={isEditing ? "default" : "ghost"}
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit(index);
                    }}
                    title="Edit Service"
                    type="button"
                    className="h-9 w-9 sm:h-8 sm:w-8"
                  >
                    <PencilIcon className="h-4 w-4 sm:h-3 sm:w-3" />
                  </Button>
                )}
                {onDuplicate && (
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDuplicate(index);
                    }}
                    title="Duplicate Service"
                    type="button"
                    className="h-9 w-9 sm:h-8 sm:w-8"
                  >
                    <Copy className="h-4 w-4 sm:h-3 sm:w-3" />
                  </Button>
                )}
                {onRemove && (
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemove(index);
                    }}
                    title="Remove Service"
                    type="button"
                    className="h-9 w-9 sm:h-8 sm:w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash className="h-4 w-4 sm:h-3 sm:w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {/* Compact details section - always visible but mobile-optimized */}
          <div className="space-y-2 text-xs sm:text-sm border-t pt-3">
            {/* Key details in a compact grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Duration info */}
              {isCharter ? (
                <>
                  <div className="text-muted-foreground">Duration:</div>
                  <div className="font-medium text-blue-600">
                    {item.service_days} day{item.service_days !== 1 ? 's' : ''} × {item.hours_per_day}h/day
                  </div>
                </>
              ) : (
                <>
                  <div className="text-muted-foreground">Duration:</div>
                  <div>{item.duration_hours} hour(s)</div>
                </>
              )}
              
              {/* Unit price with edit capability */}
              <div className="text-muted-foreground">Unit Price:</div>
              <div className="flex items-center gap-2">
                {isEditingPrice ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handlePriceSave();
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          handlePriceCancel();
                        }
                      }}
                      className="h-8 text-sm w-24 focus:w-32 transition-all duration-200"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handlePriceSave}
                      className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-700"
                      title="Save price (Enter)"
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handlePriceCancel}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-700"
                      title="Cancel (Esc)"
                    >
                      <XIcon className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-medium",
                      hasCustomPrice && "text-blue-600"
                    )}>
                      {formatCurrency(item.unit_price)}
                    </span>
                    {hasCustomPrice && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        Custom
                      </Badge>
                    )}
                    {onPriceChange && !isPackage && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handlePriceEdit}
                        className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-700"
                        title="Edit Price"
                      >
                        <Edit3 className="h-3 w-3 text-blue-600" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Time-based adjustments - always visible if they exist */}
              {item.time_based_adjustment && (
                <>
                  <div className="text-muted-foreground">Time Adjustment:</div>
                  <div className={cn(
                    "font-medium",
                    item.time_based_adjustment > 0 ? "text-orange-600" : "text-green-600"
                  )}>
                    {item.time_based_adjustment > 0 ? '+' : ''}{formatCurrency(Math.abs(timeAdjustmentAmount))}
                    <span className="text-xs ml-1">
                      ({item.time_based_adjustment > 0 ? '+' : ''}{item.time_based_adjustment}%)
                    </span>
                    {item.time_based_rule_name && (
                      <div className="text-xs text-orange-600 mt-1 font-normal">
                        {item.time_based_rule_name}
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {/* Pickup info - compact display */}
              {(item.pickup_date || item.pickup_time) && (
                <>
                  <div className="text-muted-foreground">Pickup:</div>
                  <div className="text-xs">
                    {item.pickup_date ? format(parseISO(item.pickup_date), 'MMM d') : 'N/A'}
                    {item.pickup_time && ` at ${item.pickup_time}`}
                  </div>
                </>
              )}
            </div>
            
            {/* Package details - always visible for packages */}
            {isPackage && correspondingPackage && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="text-muted-foreground text-xs mb-1">Services Included:</div>
                {correspondingPackage.items && correspondingPackage.items.length > 0 ? (
                  <div className="space-y-1">
                    {correspondingPackage.items.map((pkgItem: any, pkgIndex: number) => (
                      <div key={pkgIndex} className="text-purple-600 text-xs">
                        • {pkgItem.name}
                        {pkgItem.vehicle_type && (
                          <span className="text-muted-foreground ml-1">({pkgItem.vehicle_type})</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-purple-600 text-xs">• All package services included</div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
