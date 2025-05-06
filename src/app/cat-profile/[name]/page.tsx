"use client"
import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { useParams } from "next/navigation"
import Header from "@/components/layouts/Header"
import Image from "next/image"
import Footer from "@/components/layouts/Footer"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination } from "swiper/modules"
import ParentInfoPopup from "@/components/elements/CatsRelated/ParentInfoModal"
import "swiper/swiper-bundle.css"
import { fetchCatByName, incrementCatViewCount } from "@/lib/api/catClient"
import type { CatProfile } from "@/lib/types/cat"

export default function CatProfilePage() {
    const params = useParams()
    const [cat, setCat] = useState<CatProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch cat data from Firebase
    useEffect(() => {
        const fetchCat = async () => {
            try {
                setLoading(true)

                // Safely extract the name parameter
                const nameParam = params?.name

                // If name is not available, set an error
                if (!nameParam) {
                    setError("Cat name is missing")
                    setLoading(false)
                    return
                }

                // Convert the name parameter to a string (it comes as string or string[])
                const catName = Array.isArray(nameParam) ? nameParam[0] : nameParam

                // Decode the URL-encoded name
                const decodedName = decodeURIComponent(catName)

                // Get cat by name from API
                const catData = await fetchCatByName(decodedName)

                if (!catData) {
                    setError("Cat not found")
                } else {
                    setCat(catData as CatProfile)

                    // Increment view count
                    if (catData.id) {
                        incrementCatViewCount(catData.id).catch(console.error)
                    }
                }
            } catch (err) {
                console.error("Error fetching cat:", err)
                setError("Failed to load cat data")
            } finally {
                setLoading(false)
            }
        }

        fetchCat()
    }, [params])

    const media = useMemo(() => {
        if (!cat) return []

        return [
            ...(cat.videos || []).map((video) => ({ type: "video", src: video })),
            ...(cat.images || []).map((image) => ({ type: "image", src: image })),
            // Add main image if it exists and isn't already in the images array
            ...(cat.mainImage && (!cat.images || !cat.images.includes(cat.mainImage))
              ? [{ type: "image", src: cat.mainImage }]
              : []),
        ]
    }, [cat])

    const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)
    const [selectedMedia, setSelectedMedia] = useState<{ type: string; src: string } | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const swiperRef = useRef(null)

    useEffect(() => {
        if (media.length > 0 && media[selectedMediaIndex]) {
            setSelectedMedia(media[selectedMediaIndex])
        } else {
            setSelectedMedia(null)
        }
    }, [selectedMediaIndex, media])

    const openModal = (index: number) => {
        if (selectedMedia?.type === "video" && videoRefs.current[index] && !videoRefs.current[index]?.paused) {
            videoRefs.current[index]?.pause()
        }
        setSelectedMediaIndex(index)
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
    }

    const handleVideoFrameClick = (e: React.MouseEvent) => {
        e.preventDefault()
        openModal(selectedMediaIndex)
    }

    const handleSlideChange = (swiper: any) => {
        const newIndex = swiper.realIndex
        setSelectedMediaIndex(newIndex)
    }

    const handleModalSlideChange = (swiper: any) => {
        const currentIndex = swiper.realIndex
        videoRefs.current.forEach((video: HTMLVideoElement | null, index: number) => {
            if (video && !video.paused && index !== currentIndex) {
                video.pause()
            }
        })
    }

    // Function to proxy media URLs
    const getProxiedUrl = (url: string) => {
        if (!url) return ""

        // Check if it's a Firebase Storage URL
        if (url.includes("firebasestorage.googleapis.com")) {
            return `/api/image-proxy?url=${encodeURIComponent(url)}`
        }

        return url
    }

    // Loading state
    if (loading) {
        return (
          <>
              <Header />
              <div className="bg-[#1C1C21] text-white min-h-screen flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
              <Footer />
          </>
        )
    }

    // Error state
    if (error || !cat) {
        return (
          <>
              <Header />
              <div className="bg-[#1C1C21] text-white min-h-screen flex flex-col items-center justify-center p-4">
                  <h2 className="text-2xl font-bold mb-4">Cat not found</h2>
                  <p className="text-gray-400">{error || "The cat you're looking for doesn't exist or has been removed."}</p>
              </div>
              <Footer />
          </>
        )
    }

    return (
      <>
          <Header />
          <div className="bg-[#1C1C21] text-white min-h-screen">
              <div className="bg-gray-200 text-center py-20 mt-18">
                  <h1 className="text-4xl lg:text-5xl text-black font-bold">{cat.name}</h1>
                  <p className="text-lg lg:text-xl text-blue-950 mt-4">{cat.description || `${cat.breed} ${cat.gender}`}</p>
              </div>

              <div className="container mx-auto py-10 px-4 flex flex-col lg:flex-row lg:gap-16 lg:py-16 lg:px-8">
                  <div className="lg:w-1/2 lg:order-2">
                      <div className="text-left mb-6 lg:mb-0">
                          <h2 className="text-2xl lg:text-3xl font-bold mb-4">{cat.name} Is Ready for Adoption</h2>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <h3 className="text-lg lg:text-xl font-semibold mb-2">AVAILABILITY:</h3>
                                  <p
                                    className={`text-xl font-bold mb-4 ${
                                      cat.availability === "Available"
                                        ? "text-green-500"
                                        : cat.availability === "Reserved"
                                          ? "text-yellow-500"
                                          : cat.availability === "Sold"
                                            ? "text-red-500"
                                            : "text-blue-500"
                                    }`}
                                  >
                                      {cat.availability || "Available"}
                                  </p>
                                  <h3 className="text-lg lg:text-xl font-semibold mb-2">COLOR:</h3>
                                  <p className="text-gray-400 mb-4">{cat.color || "Not specified"}</p>
                                  <h3 className="text-lg lg:text-xl font-semibold mb-2">GENDER:</h3>
                                  <p className="text-gray-400 mb-4">{cat.gender || "Not specified"}</p>
                                  <h3 className="text-lg lg:text-xl font-semibold mb-2">BREED:</h3>
                                  <p className="text-gray-400 mb-4">{cat.breed || "Not specified"}</p>
                              </div>
                              <div>
                                  <h3 className="text-lg lg:text-xl font-semibold mb-2">CATEGORY:</h3>
                                  <p className="text-gray-400 mb-4">{cat.category || "Not specified"}</p>
                                  <h3 className="text-lg lg:text-xl font-semibold mb-2">VACCINATED:</h3>
                                  <p className="text-gray-400 mb-4">{cat.isVaccinated ? "Yes" : "No"}</p>
                                  <h3 className="text-lg lg:text-xl font-semibold mb-2">MICROCHIPPED:</h3>
                                  <p className="text-gray-400 mb-4">{cat.isMicrochipped ? "Yes" : "No"}</p>
                                  <h3 className="text-lg lg:text-xl font-semibold mb-2">BORN:</h3>
                                  <p className="text-gray-400 mb-4">{cat.yearOfBirth || "Unknown"}</p>
                              </div>
                          </div>
                          <div className="mt-4">
                              <ParentInfoPopup currentCatId={cat.id} />
                          </div>
                      </div>
                  </div>

                  <div className="lg:w-1/2 lg:order-1">
                      <div className="w-full h-[350px] lg:h-[500px] mx-auto relative">
                          {selectedMedia?.type === "video" ? (
                            <video
                              key={selectedMedia.src}
                              controls
                              ref={(el) => {
                                  if (el) videoRefs.current[selectedMediaIndex] = el
                              }}
                              className="rounded-lg shadow-lg w-full h-full object-cover cursor-pointer main-video"
                              onClick={handleVideoFrameClick}
                            >
                                <source src={getProxiedUrl(selectedMedia.src)} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                          ) : selectedMedia ? (
                            <Image
                              src={getProxiedUrl(selectedMedia.src) || "/placeholder.svg?height=500&width=500&query=cat"}
                              alt={cat.name}
                              className="rounded-lg shadow-lg object-cover cursor-pointer"
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                              onClick={() => openModal(selectedMediaIndex)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
                                <p className="text-gray-400">No media available</p>
                            </div>
                          )}
                      </div>

                      {media.length > 0 && (
                        <Swiper
                          ref={swiperRef}
                          spaceBetween={10}
                          slidesPerView={3}
                          loop={media.length > 3}
                          navigation={true}
                          pagination={{ clickable: true }}
                          modules={[Navigation, Pagination]}
                          className="mt-4 small-carousel"
                          onSlideChange={handleSlideChange}
                        >
                            {media.map((item, index) => (
                              <SwiperSlide key={index} className="flex items-center justify-center">
                                  <div className="w-[100px] h-[100px] lg:w-[150px] lg:h-[150px] relative">
                                      {item.type === "video" ? (
                                        <div
                                          className="rounded-lg w-full h-full cursor-pointer relative bg-black flex items-center justify-center"
                                          onClick={() => setSelectedMediaIndex(index)}
                                        >
                                            <div className="absolute inset-0 bg-black opacity-50 rounded-lg"></div>
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              className="h-12 w-12 text-white z-10"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                            >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                                />
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </div>
                                      ) : (
                                        <Image
                                          src={getProxiedUrl(item.src) || "/placeholder.svg?height=150&width=150&query=cat"}
                                          alt={`${cat.name} media ${index + 1}`}
                                          className="rounded-lg object-cover cursor-pointer"
                                          fill
                                          sizes="(max-width: 768px) 100px, 150px"
                                          onClick={() => setSelectedMediaIndex(index)}
                                        />
                                      )}
                                  </div>
                              </SwiperSlide>
                            ))}
                        </Swiper>
                      )}
                  </div>
              </div>
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
                <div className="relative w-full h-full">
                    <button className="absolute top-4 right-4 text-white text-2xl z-50" onClick={closeModal}>
                        &times;
                    </button>

                    <Swiper
                      spaceBetween={10}
                      slidesPerView={1}
                      initialSlide={selectedMediaIndex}
                      loop={media.length > 1}
                      navigation={true}
                      pagination={{ clickable: true }}
                      modules={[Navigation, Pagination]}
                      className="fullscreen-carousel"
                      onSlideChange={handleModalSlideChange}
                    >
                        {media.map((item, index) => (
                          <SwiperSlide key={index}>
                              {item.type === "video" ? (
                                <video
                                  ref={(el) => {
                                      if (el) videoRefs.current[index] = el
                                  }}
                                  controls
                                  className="w-full h-screen object-contain"
                                >
                                    <source src={getProxiedUrl(item.src)} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                              ) : (
                                <div className="relative w-full h-screen">
                                    <Image
                                      src={getProxiedUrl(item.src) || "/placeholder.svg?height=800&width=800&query=cat"}
                                      alt={`${cat.name} - Image ${index + 1}`}
                                      fill
                                      className="object-contain"
                                      sizes="100vw"
                                      priority={index === 0}
                                    />
                                </div>
                              )}
                          </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
          )}

          <Footer />
      </>
    )
}
