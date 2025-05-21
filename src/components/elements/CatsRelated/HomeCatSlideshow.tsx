"use client"
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/swiper-bundle.css"
import { Navigation, Pagination, Autoplay } from "swiper/modules"
import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { getProxiedImageUrl } from "@/lib/utils/image-utils"
import type { MediaItem } from "@/lib/firebase/storageService" // Keep the original type import
import { fetchLockedMedia } from "@/lib/api/mediaClient" // Import API client function
import useMobile from "@/hooks/use-mobile"

function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
}

// Function to estimate aspect ratio from image URL or use default categorization
function categorizeByImageType(media: MediaItem[]): {
    widescreen: MediaItem[]
    standard: MediaItem[]
} {
    const widescreen: MediaItem[] = []
    const standard: MediaItem[] = []

    media.forEach((item) => {
        // Since we don't have metadata with dimensions, we'll use a heuristic approach
        // based on image name or path patterns if available
        const url = item.url.toLowerCase()
        const name = item.name.toLowerCase()

        // Check for common patterns in filenames or paths that might indicate aspect ratio
        // For example, images with "wide", "banner", "landscape" might be widescreen
        // Images with "square", "portrait", "profile" might be standard/square
        if (
          url.includes("wide") ||
          url.includes("banner") ||
          url.includes("landscape") ||
          url.includes("16x9") ||
          name.includes("wide") ||
          name.includes("banner") ||
          name.includes("landscape") ||
          name.includes("16x9")
        ) {
            widescreen.push(item)
        } else if (
          url.includes("square") ||
          url.includes("portrait") ||
          url.includes("profile") ||
          url.includes("4x3") ||
          name.includes("square") ||
          name.includes("portrait") ||
          name.includes("profile") ||
          name.includes("4x3")
        ) {
            standard.push(item)
        } else {
            // For images without clear indicators, randomly assign to maintain balance
            // This ensures we have images in both categories
            if (widescreen.length <= standard.length) {
                widescreen.push(item)
            } else {
                standard.push(item)
            }
        }
    })

    return { widescreen, standard }
}

export default function HeroSlideshow() {
    const isMobile = useMobile()
    const [slides, setSlides] = useState<MediaItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchLockedMediaItems = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            // Replace direct Firebase call with API client call
            const response = await fetchLockedMedia()

            // Check if response has media property
            if (!response || !response.media) {
                throw new Error("Invalid response from media API")
            }

            const lockedMedia = response.media.filter((item) => item.type === "image")

            // Categorize images by estimated aspect ratio
            const { widescreen, standard } = categorizeByImageType(lockedMedia)

            // Use appropriate images based on device
            let selectedMedia = isMobile ? standard : widescreen

            // If we don't have enough images in the preferred category, mix in some from the other
            if (selectedMedia.length < 3) {
                const otherMedia = isMobile ? widescreen : standard
                selectedMedia = [...selectedMedia, ...otherMedia]
            }

            const shuffledMedia = shuffleArray(selectedMedia)
            setSlides(shuffledMedia)
        } catch (err) {
            console.error("Error fetching locked media:", err)
            setError("Failed to load locked media")
        } finally {
            setLoading(false)
        }
    }, [isMobile])

    useEffect(() => {
        fetchLockedMediaItems()
    }, [fetchLockedMediaItems])

    if (loading) {
        return <div className="text-center py-4">Loading slideshow...</div>
    }

    if (error) {
        return <div className="text-center py-4 text-red-500">Error: {error}</div>
    }

    // Set appropriate height based on device
    const slideHeight = isMobile ? "h-[500px]" : "h-[870px]"

    return (
      <section className="relative">
          <Swiper
            spaceBetween={50}
            navigation={true}
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            modules={[Navigation, Pagination, Autoplay]}
            className="w-full h-full"
          >
              {slides.map((slide, index) => (
                <SwiperSlide key={slide.id}>
                    <div
                      className={`relative flex items-center justify-center ${slideHeight} bg-gray-200 border-4 border-gray-300`}
                    >
                        <div className="absolute inset-0 w-full h-full">
                            <Image
                              src={getProxiedImageUrl(slide.url) || "/placeholder.svg?height=870&width=1546"}
                              alt={slide.name || "Cat image"}
                              fill
                              className="object-cover"
                              style={{
                                  objectFit: "cover",
                                  objectPosition: "center",
                              }}
                              sizes="(max-width: 768px) 100vw, 100vw"
                              priority={index < 3}
                            />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black bg-opacity-30">
                            <div className="text-center text-white p-4">
                                <h1 className="text-4xl md:text-5xl font-bold">RED CAT CUASAR</h1>
                                <p className="mt-4 text-lg md:text-xl">THE JOURNEY STARTS HERE</p>
                            </div>
                        </div>
                    </div>
                </SwiperSlide>
              ))}
          </Swiper>
      </section>
    )
}
