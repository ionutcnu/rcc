"use client"

import type React from "react"
import { Inter, Patrick_Hand } from "next/font/google"
import { useEffect } from "react"
import "./styles/globals.css"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import SeoHead from "@/components/seo/seo-head"
import { Suspense } from "react"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/toaster"


// Configure main fonts
const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
})

const patrickHand = Patrick_Hand({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-patrick",
    display: "swap",
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
    }, [])

    return (
        <html lang="en" className={`${inter.variable} ${patrickHand.variable}`}>
        <head>
            <link rel="icon" href="/favicon.ico" />
            <SeoHead />
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
