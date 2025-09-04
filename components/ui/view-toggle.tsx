"use client"

import { LayoutGrid, List } from "lucide-react"
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
    <div className="touch-manipulation">
      <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1 w-fit">
        <button 
          className={`p-2 rounded ${view === "list" ? "bg-background shadow-sm" : ""}`}
          onClick={handleListClick}
          title="List view"
          aria-label="List view"
        >
          <List className={`h-4 w-4 ${view === "list" ? "" : "text-muted-foreground"}`} />
        </button>
        <button 
          className={`p-2 rounded ${view === "grid" ? "bg-background shadow-sm" : ""}`}
          onClick={handleGridClick}
          title="Grid view"
          aria-label="Grid view"
        >
          <LayoutGrid className={`h-4 w-4 ${view === "grid" ? "" : "text-muted-foreground"}`} />
        </button>
      </div>
    </div>
  )
} 