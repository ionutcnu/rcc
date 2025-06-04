"use client"

import type React from "react"
import { useEffect, useState } from "react"

export default function AdminProtected({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true)

    // Since server-side layout already handles authentication checks,
    // we only need a brief loading state for smooth UI transition
    useEffect(() => {
        // Short delay to prevent flash of loading screen
        const timer = setTimeout(() => {
            setLoading(false)
        }, 100)

        return () => clearTimeout(timer)
    }, [])

    if (loading) {
        return (
          <div className="flex min-h-screen items-center justify-center">
              <div className="text-center">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-lg text-orange-600">Loading...</p>
              </div>
          </div>
        )
    }

    return <>{children}</>
}
