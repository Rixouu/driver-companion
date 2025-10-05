"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Users, Settings } from "lucide-react";

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
}

interface DriverVisibilityToggleProps {
  drivers: Driver[];
  visibleDrivers: string[];
  onVisibilityChange: (visibleDrivers: string[]) => void;
}

export function DriverVisibilityToggle({ 
  drivers, 
  visibleDrivers, 
  onVisibilityChange 
}: DriverVisibilityToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDriverToggle = (driverId: string, checked: boolean) => {
    if (checked) {
      onVisibilityChange([...visibleDrivers, driverId]);
    } else {
      onVisibilityChange(visibleDrivers.filter(id => id !== driverId));
    }
  };

  const handleSelectAll = () => {
    onVisibilityChange(drivers.map(d => d.id));
  };

  const handleSelectNone = () => {
    onVisibilityChange([]);
  };

  const visibleCount = visibleDrivers.length;
  const totalCount = drivers.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          <span>Drivers</span>
          <Badge variant="secondary" className="ml-1">
            {visibleCount}/{totalCount}
          </Badge>
          {visibleCount < totalCount ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Driver Visibility
            </h4>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                disabled={visibleCount === totalCount}
              >
                All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectNone}
                disabled={visibleCount === 0}
              >
                None
              </Button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {drivers.map((driver) => {
              const isVisible = visibleDrivers.includes(driver.id);
              return (
                <div
                  key={driver.id}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={`driver-${driver.id}`}
                    checked={isVisible}
                    onCheckedChange={(checked) => 
                      handleDriverToggle(driver.id, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`driver-${driver.id}`}
                    className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {driver.first_name} {driver.last_name}
                  </label>
                  {isVisible && (
                    <Eye className="h-4 w-4 text-primary" />
                  )}
                </div>
              );
            })}
          </div>
          
          {visibleCount === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <EyeOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No drivers selected</p>
              <p className="text-xs">Select drivers to view their schedules</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
