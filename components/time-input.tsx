import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface TimeInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function TimeInput({
  id,
  value,
  onChange,
  disabled = false,
  className = "",
}: TimeInputProps) {
  const [inputValue, setInputValue] = useState(value || "00:00");

  useEffect(() => {
    setInputValue(value || "00:00");
  }, [value]);

  // Format time to ensure it's in HH:MM format
  const formatTime = (time: string): string => {
    // If time already matches HH:MM pattern, return it
    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      return time;
    }

    // Remove non-digit characters
    const digits = time.replace(/\D/g, "");
    
    // Pad to ensure we have at least 4 digits
    const paddedDigits = digits.padStart(4, "0").substring(0, 4);
    
    // Extract hours and minutes
    const hours = parseInt(paddedDigits.substring(0, 2));
    const minutes = parseInt(paddedDigits.substring(2, 4));
    
    // Ensure valid hours (0-23) and minutes (0-59)
    const validHours = hours > 23 ? 23 : hours;
    const validMinutes = minutes > 59 ? 59 : minutes;
    
    // Format as HH:MM
    return `${validHours.toString().padStart(2, "0")}:${validMinutes.toString().padStart(2, "0")}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setInputValue(rawValue);
    
    // We'll update the actual value only if it matches a valid time pattern
    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(rawValue)) {
      onChange(rawValue);
    }
  };

  const handleBlur = () => {
    const formattedTime = formatTime(inputValue);
    setInputValue(formattedTime);
    onChange(formattedTime);
  };

  return (
    <Input
      id={id}
      type="text"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="00:00"
      pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
      disabled={disabled}
      className={className}
    />
  );
} 