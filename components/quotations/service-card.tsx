"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PencilIcon, Copy, Trash, Car, Calendar, Clock, Plane, MapPin, Users, Check, X as XIcon, Edit3 } from 'lucide-react';
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

  // Helper functions for date/time formatting
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      // Check if time already contains AM/PM
      if (timeString.includes('AM') || timeString.includes('PM')) {
        return timeString;
      }
      
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

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
      
      <CardContent className="p-6">
        <div className="space-y-5">
          {/* Header with service type and total price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant={
                isPackage ? "secondary" :
                isCharter ? "default" : "outline"
              } className={cn(
                "text-xs px-3 py-1 font-bold uppercase tracking-wide",
                isPackage && "bg-purple-500 text-white",
                isCharter && "bg-blue-500 text-white",
                isTransfer && "bg-green-500 text-white"
              )}>
                {isPackage ? 'PACKAGE' : isCharter ? 'CHARTER' : 'SERVICE'}
              </Badge>
              {isEditing && <Badge variant="outline" className="text-xs px-2 py-1">Editing</Badge>}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-500">
                {(() => {
                  // For Charter Services, calculate total based on duration (unit_price × service_days)
                  if (isCharter) {
                    return formatCurrency(item.unit_price * (item.service_days || 1));
                  }
                  // For other services, use existing logic
                  return formatCurrency(item.total_price || item.unit_price);
                })()}
              </div>
            </div>
          </div>

          {/* Service name and basic info */}
          <div>
            <h3 className="text-lg font-bold text-white mb-2">{item.service_type_name || 'Service'}</h3>
            <div className="text-sm text-gray-400">
              {!isPackage && item.vehicle_type && (
                <span className="mr-4">{item.vehicle_type}</span>
              )}
              {item.service_days && item.hours_per_day ? (
                <span>{item.service_days} days × {item.hours_per_day}h/day</span>
              ) : item.duration_hours && (
                <span>{item.duration_hours} hour(s)</span>
              )}
            </div>
          </div>

          {/* Two-column layout like the reference */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Date & Duration */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">DATE & DURATION</h4>
                <div className="space-y-1">
                  {item.pickup_date && (
                    <div className="text-sm text-white">{formatDate(item.pickup_date)}</div>
                  )}
                  {item.pickup_time && (
                    <div className="text-sm text-white">{formatTime(item.pickup_time)}</div>
                  )}
                  <div className="text-sm text-gray-400">
                    {formatCurrency(item.unit_price)} per day
                  </div>
                </div>
              </div>

              {/* Flight Details - only for Airport services */}
              {(item.flight_number || item.terminal) && 
               item.service_type_name?.toLowerCase().includes('airport') && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">FLIGHT DETAILS</h4>
                  <div className="space-y-1">
                    {item.flight_number && (
                      <div className="flex items-center gap-2 text-sm text-white">
                        <Plane className="h-3 w-3" />
                        <span>Flight {item.flight_number}</span>
                      </div>
                    )}
                    {item.terminal && (
                      <div className="flex items-center gap-2 text-sm text-white">
                        <MapPin className="h-3 w-3" />
                        <span>Terminal {item.terminal}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Passenger and Bag Details - for all services */}
              {(item.number_of_passengers || item.number_of_bags) && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">PASSENGER & BAG DETAILS</h4>
                  <div className="space-y-1">
                    {item.number_of_passengers && (
                      <div className="flex items-center gap-2 text-sm text-white">
                        <Users className="h-3 w-3" />
                        <span>{item.number_of_passengers} passengers</span>
                      </div>
                    )}
                    {item.number_of_bags && (
                      <div className="flex items-center gap-2 text-sm text-white">
                        <MapPin className="h-3 w-3" />
                        <span>{item.number_of_bags} bags</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Locations */}
              {(item.pickup_location || item.dropoff_location) && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">LOCATIONS</h4>
                  <div className="space-y-1">
                    {item.pickup_location && (
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-white break-words">{item.pickup_location}</span>
                      </div>
                    )}
                    {item.dropoff_location && (
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-white break-words">{item.dropoff_location}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">PRICING</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white">Unit Price:</span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-semibold",
                        hasCustomPrice && "text-blue-400"
                      )}>
                        {formatCurrency(item.unit_price)}
                      </span>
                      {onPriceChange && !isPackage && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={handlePriceEdit}
                          className="h-5 w-5 p-0 hover:bg-blue-500/20"
                          title="Edit Price"
                        >
                          <Edit3 className="h-3 w-3 text-blue-400" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {item.service_days && item.service_days > 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-white">× {item.service_days} days:</span>
                      <span className="font-semibold text-white">{formatCurrency((item.unit_price || 0) * item.service_days)}</span>
                    </div>
                  )}
                  {item.time_based_adjustment && (
                    <div className="flex items-center justify-between text-orange-400">
                      <span>Time Adjustment:</span>
                      <span className="font-semibold">
                        {item.time_based_adjustment > 0 ? '+' : ''}
                        {formatCurrency(Math.abs((item.unit_price || 0) * (item.service_days || 1) * (item.time_based_adjustment / 100)))}
                        {item.time_based_rule_name && (
                          <span className="text-xs ml-1">({item.time_based_rule_name})</span>
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between font-bold text-green-500 pt-1 border-t border-gray-600">
                    <span>Total:</span>
                    <span>{formatCurrency(item.total_price || item.unit_price || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

            
          {/* Action buttons */}
          {showActions && (
            <div className="flex gap-2 justify-end pt-4 border-t border-muted">
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
                  className="h-9 w-9 p-0"
                >
                  <PencilIcon className="h-4 w-4" />
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
                  className="h-9 w-9 p-0"
                >
                  <Copy className="h-4 w-4" />
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
                  className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Price editing modal */}
      {isEditingPrice && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-600 min-w-[300px]">
            <div className="flex items-center gap-2 mb-3">
              <Edit3 className="h-4 w-4 text-blue-400" />
              <span className="font-semibold text-white">Edit Unit Price</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">New Price</label>
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
                  className="bg-gray-700 border-gray-600 text-white"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handlePriceCancel}
                  className="text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handlePriceSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}