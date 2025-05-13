import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add this function to detect if code is running on server or client
export function isServer(): boolean {
  return typeof window === "undefined"
}
