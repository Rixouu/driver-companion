"use client";

import * as React from "react";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ClockPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ClockPicker({
  value = "",
  onChange,
  placeholder = "Select time",
  disabled = false,
  className,
}: ClockPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [selectedHour, setSelectedHour] = React.useState(12);
  const [selectedMinute, setSelectedMinute] = React.useState(0);
  const [isAM, setIsAM] = React.useState(true);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close clock picker when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Parse the value when it changes
  React.useEffect(() => {
    if (value) {
      const [time, period] = value.split(' ');
      if (time) {
        const [hour, minute] = time.split(':').map(Number);
        if (period === 'PM' && hour !== 12) {
          setSelectedHour(hour + 12);
        } else if (period === 'AM' && hour === 12) {
          setSelectedHour(0);
        } else {
          setSelectedHour(hour);
        }
        setSelectedMinute(minute || 0);
        setIsAM(period !== 'PM');
        setInputValue(value);
      }
    }
  }, [value]);

  // Update input value when clock selection changes
  React.useEffect(() => {
    const displayHour = selectedHour === 0 ? 12 : selectedHour > 12 ? selectedHour - 12 : selectedHour;
    const displayMinute = selectedMinute.toString().padStart(2, '0');
    const period = isAM ? 'AM' : 'PM';
    const newValue = `${displayHour}:${displayMinute} ${period}`;
    setInputValue(newValue);
  }, [selectedHour, selectedMinute, isAM]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setInputValue(input);
    
    // Try to parse the input
    const timeMatch = input.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/i);
    if (timeMatch) {
      const [, hour, minute, period] = timeMatch;
      const hourNum = parseInt(hour, 10);
      const minuteNum = parseInt(minute, 10);
      const isPM = period.toUpperCase() === 'PM';
      
      if (hourNum >= 1 && hourNum <= 12 && minuteNum >= 0 && minuteNum <= 59) {
        const adjustedHour = isPM && hourNum !== 12 ? hourNum + 12 : 
                           !isPM && hourNum === 12 ? 0 : hourNum;
        setSelectedHour(adjustedHour);
        setSelectedMinute(minuteNum);
        setIsAM(!isPM);
        onChange?.(input);
      }
    }
  };

  const handleClockClick = (hour: number, minute: number) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    const period = isAM ? 'AM' : 'PM';
    const newValue = `${displayHour}:${displayMinute} ${period}`;
    setInputValue(newValue);
    onChange?.(newValue);
    // Close the clock picker after selection
    setTimeout(() => setIsOpen(false), 200);
  };

  const handlePeriodToggle = () => {
    setIsAM(!isAM);
    const displayHour = selectedHour === 0 ? 12 : selectedHour > 12 ? selectedHour - 12 : selectedHour;
    const displayMinute = selectedMinute.toString().padStart(2, '0');
    const period = !isAM ? 'AM' : 'PM';
    const newValue = `${displayHour}:${displayMinute} ${period}`;
    setInputValue(newValue);
    onChange?.(newValue);
  };

  const handleHourChange = (delta: number) => {
    const newHour = Math.max(0, Math.min(23, selectedHour + delta));
    setSelectedHour(newHour);
    const displayHour = newHour === 0 ? 12 : newHour > 12 ? newHour - 12 : newHour;
    const displayMinute = selectedMinute.toString().padStart(2, '0');
    const period = isAM ? 'AM' : 'PM';
    const newValue = `${displayHour}:${displayMinute} ${period}`;
    setInputValue(newValue);
    onChange?.(newValue);
  };

  const handleMinuteChange = (delta: number) => {
    const newMinute = Math.max(0, Math.min(59, selectedMinute + delta));
    setSelectedMinute(newMinute);
    const displayHour = selectedHour === 0 ? 12 : selectedHour > 12 ? selectedHour - 12 : selectedHour;
    const displayMinute = newMinute.toString().padStart(2, '0');
    const period = isAM ? 'AM' : 'PM';
    const newValue = `${displayHour}:${displayMinute} ${period}`;
    setInputValue(newValue);
    onChange?.(newValue);
  };

  // Generate clock positions
  const getClockPosition = (hour: number, minute: number) => {
    const angle = (hour * 30 + minute * 0.5) * (Math.PI / 180);
    const radius = 60;
    const centerX = 80;
    const centerY = 80;
    const x = centerX + radius * Math.sin(angle);
    const y = centerY - radius * Math.cos(angle);
    return { x, y };
  };

  const currentPosition = getClockPosition(selectedHour, selectedMinute);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePeriodToggle}
            disabled={disabled}
            className="h-6 px-2 text-xs"
          >
            {isAM ? 'AM' : 'PM'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className="h-6 px-2"
          >
            <Clock className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Clock picker that expands within the field */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg p-4">
            <div className="space-y-4">
              {/* Clock Face */}
              <div className="relative w-40 h-40 mx-auto">
                <svg className="w-full h-full" viewBox="0 0 160 160">
                  {/* Clock face */}
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-muted-foreground"
                  />
                  
                  {/* Hour markers */}
                  {Array.from({ length: 12 }, (_, i) => {
                    const angle = (i * 30) * (Math.PI / 180);
                    const x1 = 80 + 60 * Math.sin(angle);
                    const y1 = 80 - 60 * Math.cos(angle);
                    const x2 = 80 + 50 * Math.sin(angle);
                    const y2 = 80 - 50 * Math.cos(angle);
                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-muted-foreground"
                      />
                    );
                  })}
                  
                  {/* Hour numbers */}
                  {Array.from({ length: 12 }, (_, i) => {
                    const angle = (i * 30) * (Math.PI / 180);
                    const x = 80 + 45 * Math.sin(angle);
                    const y = 80 - 45 * Math.cos(angle);
                    const hour = i === 0 ? 12 : i;
                    return (
                      <text
                        key={i}
                        x={x}
                        y={y + 5}
                        textAnchor="middle"
                        className="text-sm font-medium fill-current text-muted-foreground"
                      >
                        {hour}
                      </text>
                    );
                  })}
                  
                  {/* Clock hands */}
                  <line
                    x1="80"
                    y1="80"
                    x2={currentPosition.x}
                    y2={currentPosition.y}
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-primary"
                  />
                  
                  {/* Center dot */}
                  <circle
                    cx="80"
                    cy="80"
                    r="4"
                    fill="currentColor"
                    className="text-primary"
                  />
                </svg>
                
                {/* Clickable areas for each hour */}
                {Array.from({ length: 12 }, (_, i) => {
                  const hour = i === 0 ? 12 : i;
                  const angle = (i * 30) * (Math.PI / 180);
                  const x = 80 + 60 * Math.sin(angle);
                  const y = 80 - 60 * Math.cos(angle);
                  return (
                    <button
                      key={i}
                      className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full hover:bg-primary/20 transition-colors"
                      style={{ left: x, top: y }}
                      onClick={() => handleClockClick(hour, selectedMinute)}
                      title={`Select ${hour}:${selectedMinute.toString().padStart(2, '0')}`}
                      aria-label={`Select ${hour}:${selectedMinute.toString().padStart(2, '0')}`}
                    />
                  );
                })}
              </div>
              
              {/* Time controls */}
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleHourChange(1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={selectedHour === 0 ? 12 : selectedHour > 12 ? selectedHour - 12 : selectedHour}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (value >= 1 && value <= 12) {
                        const adjustedHour = value === 12 ? (isAM ? 0 : 12) : 
                                           isAM ? value : value + 12;
                        setSelectedHour(adjustedHour);
                        const displayMinute = selectedMinute.toString().padStart(2, '0');
                        const period = isAM ? 'AM' : 'PM';
                        const newValue = `${value}:${displayMinute} ${period}`;
                        setInputValue(newValue);
                        onChange?.(newValue);
                      }
                    }}
                    className="w-12 h-8 text-center text-lg font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleHourChange(-1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="text-2xl font-mono">:</div>
                
                <div className="flex flex-col items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleMinuteChange(1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={selectedMinute}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (value >= 0 && value <= 59) {
                        setSelectedMinute(value);
                        const displayHour = selectedHour === 0 ? 12 : selectedHour > 12 ? selectedHour - 12 : selectedHour;
                        const displayMinute = value.toString().padStart(2, '0');
                        const period = isAM ? 'AM' : 'PM';
                        const newValue = `${displayHour}:${displayMinute} ${period}`;
                        setInputValue(newValue);
                        onChange?.(newValue);
                      }
                    }}
                    className="w-12 h-8 text-center text-lg font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleMinuteChange(-1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant={isAM ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsAM(true)}
                    className="px-4"
                  >
                    AM
                  </Button>
                  <Button
                    type="button"
                    variant={!isAM ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsAM(false)}
                    className="px-4"
                  >
                    PM
                  </Button>
                </div>
              </div>
              
              {/* Quick time buttons */}
              <div className="grid grid-cols-4 gap-2">
                {['6:00 AM', '9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM', '9:00 PM', '12:00 AM', '3:00 AM'].map((time) => {
                  const [timeStr, period] = time.split(' ');
                  const [hour, minute] = timeStr.split(':').map(Number);
                  const isPM = period === 'PM';
                  const adjustedHour = isPM && hour !== 12 ? hour + 12 : 
                                     !isPM && hour === 12 ? 0 : hour;
                  const isSelected = selectedHour === adjustedHour && selectedMinute === minute && isAM === !isPM;
                  
                  return (
                    <Button
                      key={time}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedHour(adjustedHour);
                        setSelectedMinute(minute);
                        setIsAM(!isPM);
                        const newValue = `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
                        setInputValue(newValue);
                        onChange?.(newValue);
                        // Close the clock picker after selection
                        setTimeout(() => setIsOpen(false), 200);
                      }}
                      className="text-xs"
                    >
                      {time}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
