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
      <div className="flex border rounded-lg">
        <button 
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-l-lg border-r ${
            view === "list" 
              ? "bg-background text-foreground" 
              : "bg-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={handleListClick}
          title="List view"
          aria-label="List view"
        >
          <List className="h-4 w-4" />
          List
        </button>
        <button 
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-r-lg ${
            view === "grid" 
              ? "bg-background text-foreground" 
              : "bg-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={handleGridClick}
          title="Cards view"
          aria-label="Cards view"
        >
          <LayoutGrid className="h-4 w-4" />
          Cards
        </button>
      </div>
    </div>
  )
} 