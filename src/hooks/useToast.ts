"use client"

import { toast as shadcnToast } from "@/hooks/use-toast"

interface ToastOptions {
  title?: string
  description?: string
  duration?: number
}

export const useToast = () => {
  const showToast = (
    type: "default" | "destructive" | "success",
    message: string,
    options?: ToastOptions
  ) => {
    const { title, description, duration = 4000 } = options || {}
    
    shadcnToast({
      variant: type === "success" ? "default" : type,
      title: title || (type === "success" ? "Success" : type === "destructive" ? "Error" : "Info"),
      description: description || message,
      duration,
      className: type === "success" ? "border-green-500 bg-green-50 text-green-900" : undefined
    })
  }

  return {
    toast: {
      success: (message: string, options?: ToastOptions) => 
        showToast("success", message, options),
      
      error: (message: string, options?: ToastOptions) => 
        showToast("destructive", message, options),
      
      info: (message: string, options?: ToastOptions) => 
        showToast("default", message, options),
      
      // Legacy compatibility for existing showPopup calls
      show: (message: string) => showToast("default", message)
    }
  }
}

// Legacy export for drop-in replacement
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    const { title, description, duration = 4000 } = options || {}
    shadcnToast({
      variant: "default",
      title: title || "Success",
      description: description || message,
      duration,
      className: "border-green-500 bg-green-50 text-green-900"
    })
  },
  
  error: (message: string, options?: ToastOptions) => {
    const { title, description, duration = 4000 } = options || {}
    shadcnToast({
      variant: "destructive", 
      title: title || "Error",
      description: description || message,
      duration
    })
  },
  
  info: (message: string, options?: ToastOptions) => {
    const { title, description, duration = 4000 } = options || {}
    shadcnToast({
      variant: "default",
      title: title || "Info", 
      description: description || message,
      duration
    })
  }
}