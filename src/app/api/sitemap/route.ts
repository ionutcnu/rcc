import { NextResponse } from "next/server"
import { getSettings } from "@/lib/firebase/settingsService"
import { getAllCats } from "@/lib/firebase/catService"

export async function GET() {
    try {
        const settings = await getSettings()
        const seoSettings = settings.seo || {}

        // Try to determine the base URL from the OG image or use a default
        let baseUrl = "https://example.com"
        if (seoSettings.ogImage) {
            try {
                const url = new URL(seoSettings.ogImage)
                baseUrl = `${url.protocol}//${url.hostname}`
            } catch (e) {
                console.error("Invalid OG image URL, using default base URL")
            }
        }

        // Start building the sitemap XML
        let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
        sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

        // Add homepage
        sitemap += `  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`

        // Add static pages
        const staticPages = ["/about", "/contact", "/cats"]

        for (const page of staticPages) {
            sitemap += `  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`
        }

        // Add dynamic cat pages
        try {
            const cats = await getAllCats()

            for (const cat of cats) {
                // Skip deleted cats
                if (cat.isDeleted) continue

                let lastMod = new Date().toISOString()
                if (cat.updatedAt) {
                    // Check if updatedAt is a Firestore Timestamp (has seconds property)
                    if ("seconds" in cat.updatedAt) {
                        lastMod = new Date(cat.updatedAt.seconds * 1000).toISOString()
                    } else if (cat.updatedAt instanceof Date) {
                        lastMod = cat.updatedAt.toISOString()
                    }
                }

                sitemap += `  <url>
    <loc>${baseUrl}/cats/${cat.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`
            }
        } catch (error) {
            console.error("Error fetching cats for sitemap:", error)
        }

        // Close the sitemap
        sitemap += "</urlset>"

        return new NextResponse(sitemap, {
            headers: {
                "Content-Type": "application/xml",
            },
        })
    } catch (error) {
        console.error("Error generating sitemap:", error)
        return new NextResponse("Error generating sitemap", { status: 500 })
    }
}
