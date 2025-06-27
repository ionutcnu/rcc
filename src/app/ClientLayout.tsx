"use client"

import type React from "react"
import { Inter, Patrick_Hand } from "next/font/google"
import { useEffect } from "react"
import "./styles/globals.css"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

import StructuredData from "@/components/seo/structured-data"
import { Suspense } from "react"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/toaster"


// Configure main fonts with optimized loading
const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
    preload: true,
    fallback: ['system-ui', 'arial'],
})

const patrickHand = Patrick_Hand({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-patrick",
    display: "swap",
    preload: true,
    fallback: ['cursive', 'system-ui'],
})

export default function ClientLayout({
                                         children,
                                     }: Readonly<{
    children: React.ReactNode
}>) {
    useEffect(() => {
        if (process.env.NODE_ENV === "production") {
            // Override console methods in production
            const noop = () => {}
            console.log = noop
            console.error = noop
            console.warn = noop
            console.info = noop
            console.debug = noop

            // Catch unhandled promise rejections
            window.addEventListener("unhandledrejection", (event) => {
                event.preventDefault()
                // You could send to an error reporting service here
            })

            // Catch global errors
            window.addEventListener("error", (event) => {
                event.preventDefault()
                // You could send to an error reporting service here
            })
        }

        // Register service worker for image caching
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('SW registered: ', registration)
                })
                .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError)
                })
        }
    }, [])

    return (
        <html lang="en" className={`${inter.variable} ${patrickHand.variable}`}>
        <head>
            <link rel="icon" href="/favicon.ico" />
            
            {/* Critical resource preloading */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
            <link rel="preconnect" href="https://www.googletagmanager.com" />
            <link rel="dns-prefetch" href="https://www.google-analytics.com" />
            <link rel="dns-prefetch" href="https://va.vercel-scripts.com" />
            
            {/* Preload critical CSS */}
            <link rel="preload" href="/sw.js" as="script" />
            

            <StructuredData type="website" />
            <StructuredData type="organization" />
            <StructuredData type="petstore" />
        </head>
        <body className="font-patrick">
        <Suspense>
            <Providers>{children}</Providers>
        </Suspense>
        <Toaster />
        <Analytics />
        <SpeedInsights />
        </body>
        </html>
    )
}
