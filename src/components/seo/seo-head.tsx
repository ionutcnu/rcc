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
  const pageTitle = title || seoSettings?.metaTitle || "Red Cat Cuasar - Premium British Shorthair Cats & Kittens"
  const pageDescription = description || seoSettings?.metaDescription || "Discover premium British Shorthair cats and kittens from Red Cat Cuasar. GCCF-registered, health-tested breeding program with champion bloodlines."

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
      <meta name="keywords" content="British Shorthair, British Shorthair kittens, British Shorthair breeder, GCCF registered, premium cats, British Shorthair cattery, Red Cat Cuasar, champion bloodlines, quality kittens, British Shorthair colors" />
      <meta name="author" content="Red Cat Cuasar" />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <link rel="canonical" href={`https://redcatcuasar.vercel.app${path}`} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageOgImage} />
      <meta property="og:url" content={`https://redcatcuasar.vercel.app${path}`} />
      <meta property="og:site_name" content="Red Cat Cuasar" />
      <meta property="og:locale" content="en_US" />

      {/* Enhanced OG image properties */}
      <meta property="og:image:alt" content={`Preview image for ${pageTitle}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/png" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageOgImage} />
      <meta name="twitter:image:alt" content={`Preview image for ${pageTitle}`} />
      <meta name="twitter:site" content="@RedCatCuasar" />
      <meta name="twitter:creator" content="@RedCatCuasar" />

      {/* Additional SEO Meta Tags */}
      <meta name="theme-color" content="#8B5CF6" />
      <meta name="msapplication-TileColor" content="#8B5CF6" />
      <meta name="application-name" content="Red Cat Cuasar" />
      <meta name="apple-mobile-web-app-title" content="Red Cat Cuasar" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />

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
