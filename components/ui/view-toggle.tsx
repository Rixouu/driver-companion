"use client"

import { LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useEffect, useState } from "react"

interface ViewToggleProps {
  view: "list" | "grid"
  onViewChange: (view: "list" | "grid") => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  // Track if we're on mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we're on mobile on component mount
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Initial check
    checkIfMobile();
    
    // Set up listener for resize events
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Direct click handlers for better mobile support
  const handleListClick = () => {
    onViewChange("list");
  };
  
  const handleGridClick = () => {
    onViewChange("grid");
  };

  return (
    <div className={`flex rounded-md border ${isMobile ? 'p-1 shadow-sm' : ''}`}>
      <Button
        variant="ghost"
        size={isMobile ? "default" : "sm"}
        className={`${isMobile ? 'p-3' : 'px-3 py-2'} ${view === "list" ? "bg-muted" : ""}`}
        onClick={handleListClick}
        aria-label="List view"
      >
        <List className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
      </Button>
      <Button
        variant="ghost"
        size={isMobile ? "default" : "sm"}
        className={`${isMobile ? 'p-3' : 'px-3 py-2'} ${view === "grid" ? "bg-muted" : ""}`}
        onClick={handleGridClick}
        aria-label="Grid view"
      >
        <LayoutGrid className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
      </Button>
    </div>
  )
} 