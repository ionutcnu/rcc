"use client"

import { useEffect, useState, useContext } from "react"
import Script from "next/script"
import { getProxiedImageUrl } from "@/lib/utils/image-utils"
import { SettingsContext } from "@/lib/contexts/settings-context"

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
  // Try to use settings context if available, but don't throw if not
  const settingsContext = useContext(SettingsContext)
  const [localSettings, setLocalSettings] = useState<SeoSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Default placeholder image for social media
  const defaultOgImage = "/placeholder-vc3r6.png"

  useEffect(() => {
    // If we have settings context, use it (this means we're on settings page)
    if (settingsContext && settingsContext.settings) {
      const seoSettings = settingsContext.settings?.seo || {}
      setLocalSettings(seoSettings)
      setError(null)
      setLoading(false)
    } else {
      // For all pages without SettingsProvider context, use default settings
      // No API calls should be made from this component
      setLocalSettings({})
      setError(null)
      setLoading(false)
    }
  }, [settingsContext])

  if (loading && !localSettings) {
    return null
  }

  // Extract SEO settings
  const seoSettings = localSettings || {}

  // Use provided values or fall back to global settings
  const pageTitle = title || seoSettings?.metaTitle || "RCC"
  const pageDescription = description || seoSettings?.metaDescription || "Russian Cat Club"

  // Determine which OG image to use (with fallback)
  let pageOgImage = ogImage || seoSettings?.ogImage

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
      {seoSettings?.googleAnalyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${seoSettings.googleAnalyticsId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${seoSettings.googleAnalyticsId}');
            `}
          </Script>
        </>
      )}
    </>
  )
}
