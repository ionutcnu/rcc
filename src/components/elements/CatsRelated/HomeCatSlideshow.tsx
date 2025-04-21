"use client"
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/swiper-bundle.css"
import { Navigation, Pagination, Autoplay } from "swiper/modules"
import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { getProxiedImageUrl } from "@/lib/utils/image-utils"
import { getAllMedia, type MediaItem } from "@/lib/firebase/storageService"
import useMobile from "@/hooks/use-mobile"

function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
}

export default function HeroSlideshow() {
    const isMobile = useMobile()
    const [slides, setSlides] = useState<MediaItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchLockedMedia = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const allMedia = await getAllMedia(false)
            const lockedMedia = allMedia.filter((item) => item.locked && item.type === "image")
            const shuffledMedia = shuffleArray(lockedMedia)
            setSlides(shuffledMedia)
        } catch (err) {
            console.error("Error fetching locked media:", err)
            setError("Failed to load locked media")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchLockedMedia()
    }, [fetchLockedMedia])

    if (loading) {
        return <div className="text-center py-4">Loading slideshow...</div>
    }

    if (error) {
        return <div className="text-center py-4 text-red-500">Error: {error}</div>
    }

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
                        <div className="relative flex items-center justify-center h-[870px] bg-gray-200 border-4 border-gray-300">
                            <div className="absolute inset-0 w-full h-full">
                                <Image
                                    src={getProxiedImageUrl(slide.url) || "/placeholder.svg?height=870&width=1546"}
                                    alt={slide.name}
                                    fill
                                    className="object-cover"
                                    style={{
                                        objectFit: "cover",
                                    }}
                                    sizes="(max-width: 768px) 100vw, 100vw"
                                    priority={index < 3}
                                />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <div className="text-center text-white p-4">
                                    <h1 className="text-4xl font-bold">RED CAT CUASAR</h1>
                                    <p className="mt-4">THE JOURNEY STARTS HERE</p>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </section>
    )
}
