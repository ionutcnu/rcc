import { NextResponse } from "next/server"
import { getSeoSettings } from "@/lib/firebase/seoService"

export async function GET() {
    try {
        const seoSettings = await getSeoSettings()

        // Create a basic robots.txt
        const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/

# Sitemap
Sitemap: ${seoSettings.ogImage ? new URL(seoSettings.ogImage).origin : "https://example.com"}/sitemap.xml
`

        return new NextResponse(robotsTxt, {
            headers: {
                "Content-Type": "text/plain",
            },
        })
    } catch (error) {
        console.error("Error generating robots.txt:", error)

        // Return a default robots.txt in case of error
        return new NextResponse("User-agent: *\nAllow: /", {
            headers: {
                "Content-Type": "text/plain",
            },
        })
    }
}
