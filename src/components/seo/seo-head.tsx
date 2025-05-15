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
    let pageOgImage = ogImage || settings.ogImage

    // Use our proxy for Firebase Storage images
    pageOgImage = getProxiedImageUrl(pageOgImage)

    return (
      <>
          {/* Basic Meta Tags */}
          <meta name="description" content={pageDescription} />

          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:title" content={pageTitle} />
          <meta property="og:description" content={pageDescription} />
          {pageOgImage && <meta property="og:image" content={pageOgImage} />}

          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={pageTitle} />
          <meta name="twitter:description" content={pageDescription} />
          {pageOgImage && <meta name="twitter:image" content={pageOgImage} />}

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
