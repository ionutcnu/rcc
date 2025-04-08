"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { trackPageView, detectTrafficSource } from "@/lib/firebase/analyticsService"

interface PageViewTrackerProps {
    catId?: string
}

export function PageViewTracker({ catId }: PageViewTrackerProps) {
    const pathname = usePathname()

    useEffect(() => {
        // Get the referrer
        const referrer = document.referrer

        // Detect the traffic source
        const source = detectTrafficSource(referrer)

        // Track the page view
        trackPageView(pathname, source, catId)

        // This is a non-visual component, so we don't need to clean up
    }, [pathname, catId])

    // This component doesn't render anything
    return null
}
