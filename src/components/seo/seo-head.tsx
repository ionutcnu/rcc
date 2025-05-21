"use client"

import { useEffect, useState } from "react"
import Script from "next/script"
import { getProxiedImageUrl } from "@/lib/utils/image-utils"

interface SeoSettings {
  metaTitle?: string
  metaDescription?: string
  ogImage?: string
  googleAnalyticsId?: string
}

interface SeoHeadProps {
  title?: string
  description?: string
  ogImage?: string
  path?: string
}

export default function SeoHead({ title, description, ogImage, path = "" }: SeoHeadProps) {
  const [settings, setSettings] = useState<SeoSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Default placeholder image for social media
  const defaultOgImage = "/placeholder-vc3r6.png"

  useEffect(() => {
    async function loadSeoSettings() {
      // Check if we're in the admin area by looking at the URL path
      const isAdminPage = window.location.pathname.startsWith("/admin")

      if (isAdminPage) {
        try {
          setLoading(true)
          const response = await fetch("/api/settings?type=seo", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            cache: "no-store",
          })

          if (!response.ok) {
            throw new Error(`Failed to fetch SEO settings: ${response.status}`)
          }

          const data = await response.json()
          setSettings(data.seo || {})
        } catch (error) {
          console.error("Error loading SEO settings:", error)
          setError(error instanceof Error ? error.message : "Unknown error")
        } finally {
          setLoading(false)
        }
      } else {
        // For public pages, just set loading to false without making the API call
        setLoading(false)
      }
    }

    loadSeoSettings()
  }, [])

  if (loading && !settings) {
    return null
  }

  // Use provided values or fall back to global settings
  const pageTitle = title || settings?.metaTitle || "RCC"
  const pageDescription = description || settings?.metaDescription || "Russian Cat Club"

  // Determine which OG image to use (with fallback)
  let pageOgImage = ogImage || settings?.ogImage

  // If no image is provided, use the default placeholder
  if (!pageOgImage || pageOgImage.trim() === "") {
    pageOgImage = defaultOgImage
  } else {
    // Use our proxy for Firebase Storage images
    pageOgImage = getProxiedImageUrl(pageOgImage)
  }

  return (
    <>
      {/* Basic Meta Tags */}
      <meta name="description" content={pageDescription} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageOgImage} />

      {/* Add a fallback image in case the main one fails */}
      <meta property="og:image:alt" content={`Preview image for ${pageTitle}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageOgImage} />

      {/* Google Analytics */}
      {settings?.googleAnalyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${settings.googleAnalyticsId}');
            `}
          </Script>
        </>
      )}
    </>
  )
}
