import type React from "react"
import type { Metadata } from "next"
import ClientLayout from "./ClientLayout"
import { getSeoSettings } from "@/lib/server/settingsService"

// Force dynamic generation for metadata with Firebase
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'

export async function generateMetadata(): Promise<Metadata> {
    try {
        // Add a small delay to ensure Firebase connection is ready
        await new Promise(resolve => setTimeout(resolve, 100))
        const seoSettings = await getSeoSettings()
        
        return {
            title: seoSettings.metaTitle,
            description: seoSettings.metaDescription,
            metadataBase: new URL("https://redcatcuasar.vercel.app/"),
            openGraph: {
                url: "https://redcatcuasar.vercel.app/",
                type: "website",
                title: seoSettings.metaTitle,
                description: seoSettings.metaDescription,
                images: seoSettings.ogImage ? [
                    {
                        url: seoSettings.ogImage,
                        width: 1200,
                        height: 630,
                        alt: seoSettings.metaTitle,
                    },
                ] : [],
            },
            alternates: {
                canonical: "https://redcatcuasar.vercel.app/",
            },
            robots: {
                index: true,
                follow: true,
            },
        }
    } catch (error) {
        // Fallback to default metadata if settings can't be fetched
        console.error('❌ Layout: Error loading SEO settings, using fallback:', error)
        return {
            title: "Red Cat Cuasar - Premium British Shorthair Cats & Kittens",
            description: "Discover premium British Shorthair cats and kittens from Red Cat Cuasar. GCCF-registered, health-tested breeding program with champion bloodlines. Professional cattery specializing in British Shorthair temperament, colors, and quality. Reserve your kitten today.",
            keywords: "British Shorthair, British Shorthair kittens, British Shorthair breeder, GCCF registered, premium cats, British Shorthair cattery, Red Cat Cuasar, champion bloodlines, quality kittens, British Shorthair colors",
            metadataBase: new URL("https://redcatcuasar.vercel.app/"),
            openGraph: {
                url: "https://redcatcuasar.vercel.app/",
                type: "website",
                title: "Red Cat Cuasar - Premium British Shorthair Cats & Kittens",
                description: "Discover premium British Shorthair cats and kittens from Red Cat Cuasar. GCCF-registered, health-tested breeding program with champion bloodlines. Professional cattery specializing in British Shorthair temperament, colors, and quality.",
                siteName: "Red Cat Cuasar",
                locale: "en_US",
            },
            alternates: {
                canonical: "https://redcatcuasar.vercel.app/",
            },
            robots: {
                index: true,
                follow: true,
                googleBot: {
                    index: true,
                    follow: true,
                    'max-video-preview': -1,
                    'max-image-preview': 'large',
                    'max-snippet': -1,
                },
            },
            // verification: {
            //     google: process.env.GOOGLE_SITE_VERIFICATION,
            // },
        }
    }
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return <ClientLayout>{children}</ClientLayout>
}
