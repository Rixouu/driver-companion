/** Re-export all utility functions from the utils directory */
export * from "./utils"
export * from "./utils/date"

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
