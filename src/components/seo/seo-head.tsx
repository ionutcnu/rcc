"use client"

import { useEffect, useState } from "react"
import Script from "next/script"
import { getSettings } from "@/lib/firebase/settingsService"
import { getProxiedImageUrl } from "@/lib/utils/image-utils"

interface SeoHeadProps {
  title?: string
  description?: string
  ogImage?: string
  path?: string
}

export default function SeoHead({ title, description, ogImage, path = "" }: SeoHeadProps) {
  const [settings, setSettings] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  // Default placeholder image for social media
  const defaultOgImage = "/placeholder-vc3r6.png"

  useEffect(() => {
    async function loadSeoSettings() {
      try {
        const appSettings = await getSettings()
        setSettings(appSettings.seo || {})
      } catch (error) {
        console.error("Error loading SEO settings:", error)
      } finally {
        setLoading(false)
      }
    }

    loadSeoSettings()
  }, [])

  if (loading || !settings) {
    return null
  }

  // Use provided values or fall back to global settings
  const pageTitle = title || settings.metaTitle
  const pageDescription = description || settings.metaDescription

  // Determine which OG image to use (with fallback)
  let pageOgImage = ogImage || settings.ogImage

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
      {settings.googleAnalyticsId && (
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
