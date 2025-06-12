"use client"
import type React from "react"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Header from "@/components/layouts/Header"
import Image from "next/image"
import Footer from "@/components/layouts/Footer"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination, Thumbs, FreeMode } from "swiper/modules"
import ParentInfoPopup from "@/components/elements/CatsRelated/ParentInfoModal"
import "swiper/swiper-bundle.css"
import { fetchCatByName, incrementCatViewCount } from "@/lib/api/catClient"
import type { CatProfile } from "@/lib/types/cat"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { EditIcon } from "lucide-react"
import { GiCat, GiPawPrint } from "react-icons/gi"
import { FaHeart, FaPlay, FaImage, FaExpand } from "react-icons/fa"



export default function CatProfilePage() {
    const params = useParams()
    const router = useRouter()
    const { user, isAdmin } = useAuth()
    const [cat, setCat] = useState<CatProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const handleEditCat = () => {
        if (cat?.id) {
            const redirectUrl = encodeURIComponent(`/cat-profile/${encodeURIComponent(cat.name)}`)
            router.push(`/admin/cats/edit/${cat.id}?redirect=${redirectUrl}`)
        }
    }

    // Fetch cat data from Firebase
    useEffect(() => {
        const fetchCat = async () => {
            try {
                setLoading(true)
                const nameParam = params?.name
                if (!nameParam) {
                    setError("Cat name is missing")
                    setLoading(false)
                    return
                }
                const catName = Array.isArray(nameParam) ? nameParam[0] : nameParam
                const decodedName = decodeURIComponent(catName)
                const catData = await fetchCatByName(decodedName)
                if (!catData) {
                    setError("Cat not found")
                } else {
                    setCat(catData as CatProfile)
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

    // Separate videos and images
    const videos = useMemo(() => {
        if (!cat?.videos) return []
        return cat.videos
    }, [cat])

    const images = useMemo(() => {
        if (!cat) return []
        const allImages = [
            ...(cat.images || []),
            ...(cat.mainImage && (!cat.images || !cat.images.includes(cat.mainImage)) ? [cat.mainImage] : [])
        ]
        return allImages
    }, [cat])

    // Combined media items
    const mediaItems = useMemo(() => {
        const items: Array<{type: 'video' | 'image', url: string, index: number}> = []
        
        // Add videos
        videos.forEach((video, index) => {
            items.push({type: 'video', url: video, index})
        })
        
        // Add images
        images.forEach((image, index) => {
            items.push({type: 'image', url: image, index})
        })
        
        return items
    }, [videos, images])

    // Unified media state
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
    const [videoLoadError, setVideoLoadError] = useState<{[key: number]: boolean}>({})
    const mediaModalRef = useRef<HTMLDivElement | null>(null)
    const [thumbsSwiper, setThumbsSwiper] = useState<any>(null)
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)
    const [isSwipeActive, setIsSwipeActive] = useState(false)
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)

    // Legacy state for backward compatibility
    const [selectedVideoIndex, setSelectedVideoIndex] = useState(0)
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
    const videoModalRef = useRef<HTMLDivElement | null>(null)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [isImageModalOpen, setIsImageModalOpen] = useState(false)
    const imageModalRef = useRef<HTMLDivElement | null>(null)

    // Unified media modal functions
    const openMediaModal = (index: number) => {
        setSelectedMediaIndex(index)
        setIsMediaModalOpen(true)
    }

    const closeMediaModal = () => {
        setIsMediaModalOpen(false)
    }

    const navigateMedia = useCallback((direction: "prev" | "next") => {
        if (mediaItems.length <= 1) return
        
        setSelectedMediaIndex(prevIndex => {
            if (direction === "prev") {
                return prevIndex > 0 ? prevIndex - 1 : mediaItems.length - 1
            } else {
                return prevIndex < mediaItems.length - 1 ? prevIndex + 1 : 0
            }
        })
    }, [mediaItems.length])

    // Video modal functions
    const openVideoModal = (index: number) => {
        setSelectedVideoIndex(index)
        setIsVideoModalOpen(true)
    }

    const closeVideoModal = () => {
        setIsVideoModalOpen(false)
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(console.error)
        }
    }

    const navigateVideo = useCallback((direction: "prev" | "next") => {
        if (videos.length <= 1) return
        const newIndex = direction === "next" 
            ? (selectedVideoIndex + 1) % videos.length
            : (selectedVideoIndex - 1 + videos.length) % videos.length
        setSelectedVideoIndex(newIndex)
    }, [videos.length, selectedVideoIndex])

    // Image modal functions
    const openImageModal = (index: number) => {
        setSelectedImageIndex(index)
        setIsImageModalOpen(true)
    }

    const closeImageModal = () => {
        setIsImageModalOpen(false)
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(console.error)
        }
    }

    const navigateImage = useCallback((direction: "prev" | "next") => {
        if (images.length <= 1) return
        const newIndex = direction === "next" 
            ? (selectedImageIndex + 1) % images.length
            : (selectedImageIndex - 1 + images.length) % images.length
        setSelectedImageIndex(newIndex)
    }, [images.length, selectedImageIndex])

    const toggleVideoFullscreen = async () => {
        if (!videoModalRef.current) return
        try {
            if (!document.fullscreenElement) {
                await videoModalRef.current.requestFullscreen()
            } else {
                await document.exitFullscreen()
            }
        } catch (error) {
            console.error("Fullscreen error:", error)
        }
    }

    const toggleImageFullscreen = async () => {
        if (!imageModalRef.current) return
        try {
            if (!document.fullscreenElement) {
                await imageModalRef.current.requestFullscreen()
            } else {
                await document.exitFullscreen()
            }
        } catch (error) {
            console.error("Fullscreen error:", error)
        }
    }

    // Keyboard navigation for videos
    useEffect(() => {
        const handleVideoKeyDown = (e: KeyboardEvent) => {
            if (!isVideoModalOpen) return
            switch (e.key) {
                case "Escape":
                    closeVideoModal()
                    break
                case "ArrowLeft":
                    e.preventDefault()
                    navigateVideo("prev")
                    break
                case "ArrowRight":
                    e.preventDefault()
                    navigateVideo("next")
                    break
                case "f":
                case "F":
                    e.preventDefault()
                    toggleVideoFullscreen()
                    break
            }
        }

        if (isVideoModalOpen) {
            document.addEventListener("keydown", handleVideoKeyDown)
            document.body.style.overflow = "hidden"
        } else {
            document.removeEventListener("keydown", handleVideoKeyDown)
            document.body.style.overflow = "unset"
        }

        return () => {
            document.removeEventListener("keydown", handleVideoKeyDown)
            document.body.style.overflow = "unset"
        }
    }, [isVideoModalOpen, videos.length, selectedVideoIndex, navigateVideo])

    // Keyboard navigation for images
    useEffect(() => {
        const handleImageKeyDown = (e: KeyboardEvent) => {
            if (!isImageModalOpen) return
            switch (e.key) {
                case "Escape":
                    closeImageModal()
                    break
                case "ArrowLeft":
                    e.preventDefault()
                    navigateImage("prev")
                    break
                case "ArrowRight":
                    e.preventDefault()
                    navigateImage("next")
                    break
                case "f":
                case "F":
                    e.preventDefault()
                    toggleImageFullscreen()
                    break
            }
        }

        if (isImageModalOpen) {
            document.addEventListener("keydown", handleImageKeyDown)
            document.body.style.overflow = "hidden"
        } else {
            document.removeEventListener("keydown", handleImageKeyDown)
            document.body.style.overflow = "unset"
        }

        return () => {
            document.removeEventListener("keydown", handleImageKeyDown)
            document.body.style.overflow = "unset"
        }
    }, [isImageModalOpen, images.length, selectedImageIndex, navigateImage])

    // Fullscreen function for unified media modal
    const toggleMediaFullscreen = async () => {
        if (!mediaModalRef.current) return
        try {
            if (!document.fullscreenElement) {
                await mediaModalRef.current.requestFullscreen()
            } else {
                await document.exitFullscreen()
            }
        } catch (error) {
            console.error("Fullscreen error:", error)
        }
    }

    // Keyboard navigation for unified media modal
    useEffect(() => {
        const handleMediaKeyDown = (e: KeyboardEvent) => {
            if (!isMediaModalOpen) return
            switch (e.key) {
                case "Escape":
                    closeMediaModal()
                    break
                case "ArrowLeft":
                    e.preventDefault()
                    navigateMedia("prev")
                    break
                case "ArrowRight":
                    e.preventDefault()
                    navigateMedia("next")
                    break
                case "f":
                case "F":
                    e.preventDefault()
                    toggleMediaFullscreen()
                    break
            }
        }

        if (isMediaModalOpen) {
            document.addEventListener("keydown", handleMediaKeyDown)
            document.body.style.overflow = "hidden"
        } else {
            document.removeEventListener("keydown", handleMediaKeyDown)
            document.body.style.overflow = "unset"
        }

        return () => {
            document.removeEventListener("keydown", handleMediaKeyDown)
            document.body.style.overflow = "unset"
        }
    }, [isMediaModalOpen, mediaItems.length, selectedMediaIndex, navigateMedia])

    // Touch handlers for mobile swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
        setIsSwipeActive(true)
        setSwipeDirection(null)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStart) return
        
        const currentTouch = e.targetTouches[0].clientX
        setTouchEnd(currentTouch)
        
        const distance = touchStart - currentTouch
        const threshold = 30
        
        if (Math.abs(distance) > threshold) {
            setSwipeDirection(distance > 0 ? 'left' : 'right')
        } else {
            setSwipeDirection(null)
        }
    }

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) {
            setIsSwipeActive(false)
            setSwipeDirection(null)
            return
        }
        
        const distance = touchStart - touchEnd
        const isLeftSwipe = distance > 50
        const isRightSwipe = distance < -50

        if (isLeftSwipe && mediaItems.length > 1) {
            navigateMedia("next")
        }
        if (isRightSwipe && mediaItems.length > 1) {
            navigateMedia("prev")
        }
        
        setIsSwipeActive(false)
        setSwipeDirection(null)
    }

    // Function to proxy image URLs only
    const getProxiedImageUrl = (url: string) => {
        if (!url) return ""
        if (url.includes("firebasestorage.googleapis.com")) {
            return `/api/image-proxy?url=${encodeURIComponent(url)}`
        }
        return url
    }

    // Function to get video URLs using dedicated video proxy with range request support
    const getVideoUrl = (url: string, useProxy: boolean = false) => {
        if (!url) {
            console.warn('getVideoUrl: Empty URL provided')
            return ""
        }
        
        // Use video proxy for all videos (supports range requests for seeking)
        const proxiedUrl = `/api/video-proxy?url=${encodeURIComponent(url)}`
        console.log('getVideoUrl: Using video proxy URL:', proxiedUrl)
        return proxiedUrl
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
          <div className="min-h-screen relative overflow-hidden" style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f172a 50%, #1e293b 75%, #334155 100%)'
            }}>
              {/* Floating Cat Elements */}
              <div className="cat-float top-20 left-10">
                  <GiCat className="w-16 h-16 text-pink-300/30" />
              </div>
              <div className="cat-float top-40 right-20 cat-float-delayed">
                  <GiPawPrint className="w-12 h-12 text-blue-300/30" />
              </div>
              <div className="cat-float bottom-40 left-1/4 cat-float-slow">
                  <FaHeart className="w-14 h-14 text-orange-300/30" />
              </div>
              
              {/* Cat Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                  <div className="cat-bg-pattern h-full w-full"></div>
              </div>

              {/* Hero Section */}
              <div className="relative text-center py-20 mt-18">
                  <div className="cat-glass rounded-3xl mx-auto max-w-4xl p-12 relative backdrop-blur-lg bg-white/10 border border-white/20">
                      <div className="animate-cat-bounce mb-6">
                          <GiCat className="w-20 h-20 cat-text-gradient-warm mx-auto" />
                      </div>
                      <h1 className="text-5xl lg:text-6xl font-bold cat-text-gradient-cool mb-6">{cat.name}</h1>
                      <p className="text-xl lg:text-2xl text-gray-200 leading-relaxed">
                          {cat.description || `Meet ${cat.name}, a beautiful ${cat.breed} ${cat.gender}`}
                      </p>
                      
                      {/* Admin Edit Button */}
                      {isAdmin && (
                        <div className="absolute top-4 right-4">
                            <button
                              onClick={handleEditCat}
                              className="cat-button-outline !px-4 !py-2 flex items-center text-white border-white/40 hover:border-white/60 hover:bg-white/10"
                            >
                                <EditIcon className="h-4 w-4 mr-2" />
                                Edit Cat
                            </button>
                        </div>
                      )}
                  </div>
              </div>

              <div className="container mx-auto py-10 px-4 flex flex-col lg:flex-row lg:gap-16 lg:py-16 lg:px-8">
                  {/* Cat Info Section */}
                  <div className="lg:w-1/2 lg:order-2">
                      <div className="cat-card p-8 cat-hover-lift">
                          <div className="flex items-center mb-6">
                              <div className="animate-cat-bounce mr-4">
                                  <FaHeart className="w-8 h-8 text-red-500" />
                              </div>
                              <h2 className="text-3xl lg:text-4xl font-bold cat-text-gradient-warm">
                                  {cat.name} Is Ready for Adoption
                              </h2>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-6">
                                  <div className="cat-glass rounded-xl p-4">
                                      <div className="flex items-center mb-2">
                                          <GiPawPrint className="w-4 h-4 mr-2 text-red-500" />
                                          <h3 className="text-lg font-semibold text-gray-800">Availability</h3>
                                      </div>
                                      <p className={`text-xl font-bold ${
                                        cat.availability === "Available" ? "text-green-600" :
                                        cat.availability === "Reserved" ? "text-yellow-600" :
                                        cat.availability === "Sold" ? "text-red-600" : "text-blue-600"
                                      }`}>
                                          {cat.availability || "Available"}
                                      </p>
                                  </div>
                                  
                                  <div className="cat-glass rounded-xl p-4">
                                      <div className="flex items-center mb-2">
                                          <GiCat className="w-4 h-4 mr-2 text-pink-500" />
                                          <h3 className="text-lg font-semibold text-gray-800">Color</h3>
                                      </div>
                                      <p className="text-gray-700">{cat.color || "Not specified"}</p>
                                  </div>
                                  
                                  <div className="cat-glass rounded-xl p-4">
                                      <div className="flex items-center mb-2">
                                          <GiPawPrint className="w-4 h-4 mr-2 text-blue-500" />
                                          <h3 className="text-lg font-semibold text-gray-800">Gender</h3>
                                      </div>
                                      <p className="text-gray-700">{cat.gender || "Not specified"}</p>
                                  </div>
                                  
                                  <div className="cat-glass rounded-xl p-4">
                                      <div className="flex items-center mb-2">
                                          <FaHeart className="w-4 h-4 mr-2 text-orange-500" />
                                          <h3 className="text-lg font-semibold text-gray-800">Breed</h3>
                                      </div>
                                      <p className="text-gray-700">{cat.breed || "Not specified"}</p>
                                  </div>
                              </div>
                              
                              <div className="space-y-6">
                                  <div className="cat-glass rounded-xl p-4">
                                      <div className="flex items-center mb-2">
                                          <GiCat className="w-4 h-4 mr-2 text-purple-500" />
                                          <h3 className="text-lg font-semibold text-gray-800">Category</h3>
                                      </div>
                                      <p className="text-gray-700">{cat.category || "Not specified"}</p>
                                  </div>
                                  
                                  <div className="cat-glass rounded-xl p-4">
                                      <div className="flex items-center mb-2">
                                          <GiPawPrint className="w-4 h-4 mr-2 text-green-500" />
                                          <h3 className="text-lg font-semibold text-gray-800">Vaccinated</h3>
                                      </div>
                                      <p className={`font-semibold ${cat.isVaccinated ? "text-green-600" : "text-red-600"}`}>
                                          {cat.isVaccinated ? "✓ Yes" : "✗ No"}
                                      </p>
                                  </div>
                                  
                                  <div className="cat-glass rounded-xl p-4">
                                      <div className="flex items-center mb-2">
                                          <FaHeart className="w-4 h-4 mr-2 text-indigo-500" />
                                          <h3 className="text-lg font-semibold text-gray-800">Microchipped</h3>
                                      </div>
                                      <p className={`font-semibold ${cat.isMicrochipped ? "text-green-600" : "text-red-600"}`}>
                                          {cat.isMicrochipped ? "✓ Yes" : "✗ No"}
                                      </p>
                                  </div>
                                  
                                  <div className="cat-glass rounded-xl p-4">
                                      <div className="flex items-center mb-2">
                                          <GiCat className="w-4 h-4 mr-2 text-teal-500" />
                                          <h3 className="text-lg font-semibold text-gray-800">Born</h3>
                                      </div>
                                      <p className="text-gray-700">{cat.yearOfBirth || "Unknown"}</p>
                                  </div>
                              </div>
                          </div>
                          
                          <div className="mt-8">
                              <ParentInfoPopup currentCatId={cat.id} />
                          </div>
                      </div>
                  </div>

                  {/* Unified Media Gallery */}
                  <div className="lg:w-1/2 lg:order-1 h-full flex flex-col">
                      {mediaItems.length > 0 ? (
                        <div className="cat-card p-6 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center">
                                    <div className="flex items-center mr-4">
                                        <FaImage className="w-6 h-6 text-blue-500 mr-2" />
                                        <FaPlay className="w-5 h-5 text-red-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold cat-text-gradient-warm">
                                        Media Gallery
                                    </h3>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                    {videos.length > 0 && (
                                        <div className="flex items-center">
                                            <FaPlay className="w-3 h-3 text-red-500 mr-1" />
                                            <span>{videos.length} video{videos.length !== 1 ? 's' : ''}</span>
                                        </div>
                                    )}
                                    {images.length > 0 && (
                                        <div className="flex items-center">
                                            <FaImage className="w-3 h-3 text-blue-500 mr-1" />
                                            <span>{images.length} photo{images.length !== 1 ? 's' : ''}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Main Media Viewer */}
                            <div className="w-full flex-1 min-h-[300px] lg:min-h-[400px] mb-4 relative group">
                                {mediaItems[selectedMediaIndex]?.type === 'video' ? (
                                    <>
                                        <video
                                            key={`main-video-${selectedMediaIndex}`}
                                            controls
                                            controlsList="nodownload"
                                            preload="metadata"
                                            crossOrigin="anonymous"
                                            className="rounded-lg shadow-lg object-cover cursor-pointer bg-black absolute inset-0 w-full h-full"
                                            style={{ outline: 'none' }}
                                            onError={(e) => {
                                                const video = e.currentTarget
                                                console.error('Video loading error:', {
                                                    src: video.src,
                                                    networkState: video.networkState,
                                                    readyState: video.readyState,
                                                    error: video.error
                                                })
                                                setVideoLoadError(prev => ({...prev, [selectedMediaIndex]: true}))
                                            }}
                                        >
                                            <source src={getVideoUrl(mediaItems[selectedMediaIndex].url)} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                        
                                        {/* Video Error Message */}
                                        {videoLoadError[selectedMediaIndex] && (
                                          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
                                              <div className="text-center text-white p-4">
                                                  <FaPlay className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                  <p className="text-sm">Video temporarily unavailable</p>
                                                  <button 
                                                      onClick={() => {
                                                          setVideoLoadError(prev => {
                                                              const newState = {...prev}
                                                              delete newState[selectedMediaIndex]
                                                              return newState
                                                          })
                                                      }}
                                                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                                                  >
                                                      Retry
                                                  </button>
                                              </div>
                                          </div>
                                        )}
                                    </>
                                ) : (
                                    <Image
                                        src={getProxiedImageUrl(mediaItems[selectedMediaIndex]?.url) || "/placeholder.svg?height=400&width=600&query=cat"}
                                        alt={`${cat.name} media ${selectedMediaIndex + 1}`}
                                        className="rounded-lg shadow-lg object-cover cursor-pointer"
                                        fill
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        onClick={() => openMediaModal(selectedMediaIndex)}
                                    />
                                )}
                                
                                {/* Fullscreen Button */}
                                <button
                                    onClick={() => openMediaModal(selectedMediaIndex)}
                                    className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                                    title="Open fullscreen"
                                >
                                    <FaExpand className="w-4 h-4" />
                                </button>
                                
                                {/* Navigation Arrows */}
                                {mediaItems.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => navigateMedia("prev")}
                                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                                            title="Previous"
                                        >
                                            ‹
                                        </button>
                                        <button
                                            onClick={() => navigateMedia("next")}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                                            title="Next"
                                        >
                                            ›
                                        </button>
                                    </>
                                )}
                            </div>
                            
                            {/* Media Carousel */}
                            {mediaItems.length > 1 && (
                              <div className="mt-4">
                                  <Swiper
                                      onSwiper={setThumbsSwiper}
                                      spaceBetween={8}
                                      slidesPerView="auto"
                                      freeMode={true}
                                      watchSlidesProgress={true}
                                      modules={[FreeMode, Navigation, Thumbs]}
                                      className="w-full h-20 mt-4"
                                      breakpoints={{
                                          320: { slidesPerView: 3.5, spaceBetween: 8 },
                                          480: { slidesPerView: 4.5, spaceBetween: 8 },
                                          768: { slidesPerView: 5.5, spaceBetween: 10 },
                                          1024: { slidesPerView: 6.5, spaceBetween: 12 },
                                      }}
                                  >
                                      {mediaItems.map((item, index) => (
                                        <SwiperSlide key={`${item.type}-${index}`} className="!w-20 !h-20">
                                             <div
                                                className={`relative w-20 h-20 cursor-pointer rounded-lg overflow-hidden transition-all duration-300 ${
                                                  index === selectedMediaIndex ? 'ring-2 ring-blue-500 scale-105' : 'hover:scale-102'
                                                }`}
                                                onClick={() => setSelectedMediaIndex(index)}
                                            >
                                                {item.type === 'video' ? (
                                                    <div className="w-20 h-20 bg-black flex items-center justify-center rounded-lg">
                                                        <FaPlay className="w-4 h-4 text-white" />
                                                    </div>
                                                ) : (
                                                    <Image
                                                        src={getProxiedImageUrl(item.url) || "/placeholder.svg?height=80&width=80&query=cat"}
                                                        alt={`${cat.name} thumbnail ${index + 1}`}
                                                        className="object-cover w-20 h-20 rounded-lg"
                                                        width={80}
                                                        height={80}
                                                    />
                                                )}
                                                
                                                {/* Index Number */}
                                                <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1 rounded">
                                                    {index + 1}
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                      ))}
                                  </Swiper>
                              </div>
                            )}
                        </div>
                      ) : (
                        <div className="cat-card p-8 text-center h-full flex flex-col items-center justify-center">
                            <GiCat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 text-lg">No photos or videos available for {cat.name} yet.</p>
                        </div>
                      )}
                  </div>
              </div>
          </div>

          {/* Unified Media Modal */}
          {isMediaModalOpen && mediaItems[selectedMediaIndex] && (
            <div 
              ref={mediaModalRef}
              className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeMediaModal()
              }}
            >
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* Close Button */}
                    <button 
                      className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition-colors z-50 bg-black bg-opacity-50 rounded-full w-12 h-12 md:w-12 md:h-12 flex items-center justify-center"
                      onClick={closeMediaModal}
                      title="Close (Esc)"
                    >
                        ×
                    </button>

                    {/* Fullscreen Button */}
                    <button 
                      className="absolute top-4 right-20 text-white text-xl hover:text-gray-300 transition-colors z-50 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
                      onClick={toggleMediaFullscreen}
                      title="Fullscreen (F)"
                    >
                        <FaExpand className="w-4 h-4" />
                    </button>



                    {/* Navigation Buttons */}
                    {mediaItems.length > 1 && (
                      <>
                        <button 
                          className="absolute left-4 top-1/2 md:top-1/2 md:bottom-auto bottom-5 transform -translate-y-1/2 md:transform md:-translate-y-1/2 text-white text-2xl hover:text-gray-300 transition-colors z-50 bg-black bg-opacity-50 rounded-full w-12 h-12 md:w-12 md:h-12 flex items-center justify-center"
                          onClick={() => navigateMedia("prev")}
                          title="Previous (←)"
                        >
                            ‹
                        </button>
                        <button 
                          className="absolute right-4 top-1/2 md:top-1/2 md:bottom-auto bottom-5 transform -translate-y-1/2 md:transform md:-translate-y-1/2 text-white text-2xl hover:text-gray-300 transition-colors z-50 bg-black bg-opacity-50 rounded-full w-12 h-12 md:w-12 md:h-12 flex items-center justify-center"
                          onClick={() => navigateMedia("next")}
                          title="Next (→)"
                        >
                            ›
                        </button>
                      </>
                    )}

                    {/* Media Counter */}
                    {mediaItems.length > 1 && (
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full z-50">
                          {selectedMediaIndex + 1} / {mediaItems.length}
                      </div>
                    )}

                    {/* Swipe Indicator */}
                    {isSwipeActive && swipeDirection && (
                        <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm z-60 animate-pulse">
                            {swipeDirection === 'left' ? '→ Next' : '← Previous'}
                        </div>
                    )}

                    {/* Media Content */}
                    <div 
                        className={`w-full h-full flex items-center justify-center p-4 select-none transition-transform duration-200 ease-out ${
                            isSwipeActive && swipeDirection === 'left' ? 'transform -translate-x-2' : 
                            isSwipeActive && swipeDirection === 'right' ? 'transform translate-x-2' : ''
                        }`}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {mediaItems[selectedMediaIndex]?.type === 'video' ? (
                            <video
                                key={`modal-video-${selectedMediaIndex}`}
                                controls
                                controlsList="nodownload"
                                preload="metadata"
                                crossOrigin="anonymous"
                                className="max-w-full max-h-full object-contain bg-black rounded-lg"
                                style={{ outline: 'none', maxHeight: '95vh', maxWidth: '95vw', width: '95vw', height: '95vh' }}
                                autoPlay
                            >
                                <source src={getVideoUrl(mediaItems[selectedMediaIndex].url)} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        ) : (
                            <Image
                                src={getProxiedImageUrl(mediaItems[selectedMediaIndex].url) || "/placeholder.svg?height=800&width=800&query=cat"}
                                alt={`${cat.name} media ${selectedMediaIndex + 1}`}
                                className="max-w-full max-h-full object-contain"
                                width={800}
                                height={800}
                                sizes="100vw"
                            />
                        )}
                    </div>
                </div>
            </div>
          )}

          {/* Video Modal */}
          {isVideoModalOpen && videos[selectedVideoIndex] && (
            <div 
              ref={videoModalRef}
              className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeVideoModal()
              }}
            >
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* Close Button */}
                    <button 
                      className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition-colors z-50 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
                      onClick={closeVideoModal}
                      title="Close (Esc)"
                    >
                        ×
                    </button>

                    {/* Fullscreen Button */}
                    <button 
                      className="absolute top-4 right-20 text-white text-xl hover:text-gray-300 transition-colors z-50 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
                      onClick={toggleVideoFullscreen}
                      title="Fullscreen (F)"
                    >
                        <FaExpand className="w-4 h-4" />
                    </button>

                    {/* Navigation Buttons */}
                    {videos.length > 1 && (
                      <>
                        <button 
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-2xl hover:text-gray-300 transition-colors z-50 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
                          onClick={() => navigateVideo("prev")}
                          title="Previous (←)"
                        >
                            ‹
                        </button>
                        <button 
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-2xl hover:text-gray-300 transition-colors z-50 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
                          onClick={() => navigateVideo("next")}
                          title="Next (→)"
                        >
                            ›
                        </button>
                      </>
                    )}

                    {/* Video Counter */}
                    {videos.length > 1 && (
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full z-50">
                          {selectedVideoIndex + 1} / {videos.length}
                      </div>
                    )}

                    {/* Video Content */}
                    <div className="w-full h-full flex items-center justify-center p-4">
                        <video
                            key={`modal-video-${selectedVideoIndex}`}
                            controls
                            autoPlay
                            playsInline
                            preload="metadata"
                            crossOrigin="anonymous"
                            className="max-w-full max-h-full object-contain"
                            style={{ 
                              outline: 'none',
                              backgroundColor: '#000'
                            }}
                            onContextMenu={(e) => e.preventDefault()}
                            onDoubleClick={toggleVideoFullscreen}
                            onError={(e) => {
                                const video = e.currentTarget
                                console.error('Modal video loading error:', {
                                    src: video.src,
                                    networkState: video.networkState,
                                    readyState: video.readyState,
                                    error: video.error
                                })
                            }}
                            onLoadStart={() => console.log('Modal video loading started:', videos[selectedVideoIndex])}
                            onCanPlay={() => console.log('Modal video can play')}
                            onProgress={(e) => {
                                const video = e.currentTarget
                                if (video.buffered.length > 0) {
                                    const bufferedEnd = video.buffered.end(video.buffered.length - 1)
                                    const duration = video.duration
                                    if (duration > 0) {
                                        console.log(`Video buffered: ${((bufferedEnd / duration) * 100).toFixed(1)}%`)
                                    }
                                }
                            }}
                        >
                            <source src={getVideoUrl(videos[selectedVideoIndex])} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>

                    {/* Shortcuts Info */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-xs bg-black bg-opacity-50 px-3 py-1 rounded-full z-50 opacity-70">
                        Esc: Close • ←→: Navigate • F: Fullscreen • Double-click: Fullscreen
                    </div>
                </div>
            </div>
          )}

          {/* Image Modal */}
          {isImageModalOpen && images[selectedImageIndex] && (
            <div 
              ref={imageModalRef}
              className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeImageModal()
              }}
            >
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* Close Button */}
                    <button 
                      className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 transition-colors z-50 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
                      onClick={closeImageModal}
                      title="Close (Esc)"
                    >
                        ×
                    </button>

                    {/* Fullscreen Button */}
                    <button 
                      className="absolute top-4 right-20 text-white text-xl hover:text-gray-300 transition-colors z-50 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
                      onClick={toggleImageFullscreen}
                      title="Fullscreen (F)"
                    >
                        <FaExpand className="w-4 h-4" />
                    </button>

                    {/* Navigation Buttons */}
                    {images.length > 1 && (
                      <>
                        <button 
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-2xl hover:text-gray-300 transition-colors z-50 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
                          onClick={() => navigateImage("prev")}
                          title="Previous (←)"
                        >
                            ‹
                        </button>
                        <button 
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-2xl hover:text-gray-300 transition-colors z-50 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
                          onClick={() => navigateImage("next")}
                          title="Next (→)"
                        >
                            ›
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    {images.length > 1 && (
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full z-50">
                          {selectedImageIndex + 1} / {images.length}
                      </div>
                    )}

                    {/* Image Content */}
                    <div className="w-full h-full flex items-center justify-center p-4">
                        <Image
                            src={getProxiedImageUrl(images[selectedImageIndex]) || "/placeholder.svg?height=800&width=800&query=cat"}
                            alt={`${cat.name} - Photo ${selectedImageIndex + 1}`}
                            fill
                            className="object-contain"
                            sizes="100vw"
                            priority
                        />
                    </div>

                    {/* Shortcuts Info */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-xs bg-black bg-opacity-50 px-3 py-1 rounded-full z-50 opacity-70">
                        Esc: Close • ←→: Navigate • F: Fullscreen
                    </div>
                </div>
            </div>
          )}

          <Footer />
      </>
    )
}