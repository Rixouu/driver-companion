import React from "react"

interface VisuallyHiddenProps {
  children: React.ReactNode
}

/**
 * VisuallyHidden component that hides content visually but keeps it accessible to screen readers
 */
export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return (
    <span
      className="absolute w-1 h-1 p-0 m-[-1px] overflow-hidden clip-rect-0 border-0"
      style={{
        clip: "rect(0 0 0 0)",
        clipPath: "inset(50%)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  )
} 