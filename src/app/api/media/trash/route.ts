import { type NextRequest, NextResponse } from "next/server"
import { getDeletedMedia } from "@/lib/server/mediaService"

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const searchQuery = searchParams.get("search") || undefined
    const typeFilter = searchParams.get("type") as "image" | "video" | "all" | undefined

    // Get deleted media
    const { media, totalCount, imageCount, videoCount } = await getDeletedMedia({
      searchQuery,
      type: typeFilter,
    })

    return NextResponse.json({
      media,
      totalCount,
      imageCount,
      videoCount,
    })
  } catch (error) {
    console.error("Error in trash media API:", error)
    return NextResponse.json(
      { error: "Failed to fetch trash media", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}