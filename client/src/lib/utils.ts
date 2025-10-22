// Corrected code
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  // Standard indentation (e.g., two spaces) instead of the invalid character
  return twMerge(clsx(inputs))
}