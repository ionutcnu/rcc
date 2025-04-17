import type React from "react"
import type { Metadata } from "next"
import { Inter, Patrick_Hand } from "next/font/google"
import "./styles/globals.css"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import SeoHead from "@/components/seo/seo-head"
import { AuthProvider } from "@/components/auth-provider"

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

export const metadata: Metadata = {
    title: "Meet Our Gorgeous Red Cats | Family Tree & Videos Included",
    description:
        "Adopt beautiful red cats with full lineage info, stunning photos, and short videos. Find your next feline companion today.",
    metadataBase: new URL("https://rcc-kappa.vercel.app"),
    openGraph: {
        url: "https://rcc-kappa.vercel.app",
        type: "website",
        title: "Meet Our Gorgeous Red Cats | Family Tree & Videos Included",
        description:
            "Adopt beautiful red cats with full lineage info, stunning photos, and short videos. Find your next feline companion today.",
        images: [
            {
                url: "https://firebasestorage.googleapis.com/v0/b/redcatcuasar.firebasestorage.app/o/cats%2Fimages%2F6252282e-ca88-4a46-a22b-b608aa53859e-image-1744398927041.jpeg?alt=media&token=6d9667c3-36f8-4dc8-bb57-33407e457de3",
                width: 1200,
                height: 630,
                alt: "Beautiful red cat with green eyes",
            },
        ],
    },

    alternates: {
        canonical: "https://rcc-kappa.vercel.app",
    },
    robots: {
        index: true,
        follow: true,
    },
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" className={`${inter.variable} ${patrickHand.variable}`}>
        <head>
            <link rel="icon" href="/favicon.ico" />
            <SeoHead />
        </head>
        <body className="font-patrick">
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
        <SpeedInsights />
        </body>
        </html>
    )
}
