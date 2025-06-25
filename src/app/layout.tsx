import type React from "react"
import type { Metadata } from "next"
import ClientLayout from "./ClientLayout"
import { getSeoSettings } from "@/lib/server/settingsService"

export async function generateMetadata(): Promise<Metadata> {
    try {
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
        console.error("Error fetching SEO settings:", error)
        return {
            title: "Red Cat Cuasar - British Shorthair",
            description: "Healthy, playful British Shorthair kittens raised in-home with love. GCCF-registered, vaccinated & ready for their forever families. Reserve yours today.",
            metadataBase: new URL("https://redcatcuasar.vercel.app/"),
            openGraph: {
                url: "https://redcatcuasar.vercel.app/",
                type: "website",
                title: "Red Cat Cuasar - British Shorthair",
                description: "Healthy, playful British Shorthair kittens raised in-home with love. GCCF-registered, vaccinated & ready for their forever families. Reserve yours today.",
            },
            alternates: {
                canonical: "https://redcatcuasar.vercel.app/",
            },
            robots: {
                index: true,
                follow: true,
            },
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
