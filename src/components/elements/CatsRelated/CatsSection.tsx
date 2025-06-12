"use client"
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import Particles from "../Particles"
import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import type SwiperCore from "swiper"
import Image from "next/image"
import { fetchAllCats } from "@/lib/api/catClient"
import type { CatProfile } from "@/lib/types/cat"
import { getTimestampValue } from "@/lib/types/timestamp"
import { GiCat, GiPawPrint } from "react-icons/gi"

export default function CatsSection() {
    const swiperRef = useRef<SwiperCore>()
    const [cats, setCats] = useState<CatProfile[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchCats = async () => {
            try {
                setIsLoading(true)
                console.log("Fetching cats for CatsSection...")
                // Fetch cats from API
                const fetchedCats = await fetchAllCats(false) // false means don't include deleted cats
                console.log("Fetched cats for CatsSection:", fetchedCats)

                // Check if fetchedCats is valid
                if (!Array.isArray(fetchedCats)) {
                    console.error("fetchedCats is not an array:", fetchedCats)
                    setCats([])
                    return
                }

                if (fetchedCats.length === 0) {
                    console.log("No cats returned from API")
                    setCats([])
                    return
                }

                // Sort cats by createdAt date in descending order (newest first)
                const sortedCats = fetchedCats.sort((a, b) => {
                    // Use our utility function to get timestamp values
                    return getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt)
                })

                setCats(sortedCats)
            } catch (err) {
                console.error("Error fetching cats for CatsSection:", err)
                setError("Failed to load cats. Please try again later.")
                setCats([]) // Ensure cats is an empty array on error
            } finally {
                setIsLoading(false)
            }
        }

        fetchCats()
    }, [])

    return (
      <section className="relative bg-[#1C1C21] text-white py-16">
          <Particles className="absolute inset-0 z-0" quantity={100} staticity={10} ease={50} />
          <div className="container mx-auto text-center relative z-10">
              <h2 className="text-4xl font-semibold mb-4">Meow, meow meow...</h2>
              <p className="text-xl mb-12">Hello we need a new home</p>

              {isLoading ? (
                <div className="flex justify-center items-center h-56">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
              ) : error ? (
                <div className="bg-red-500 bg-opacity-20 p-4 rounded-lg">
                    <p>{error}</p>
                </div>
              ) : cats.length === 0 ? (
                <div className="bg-yellow-500 bg-opacity-20 p-4 rounded-lg">
                    <p>No cats available at the moment. Check back soon!</p>
                </div>
              ) : (
                <Swiper
                  onSwiper={(swiper) => {
                      swiperRef.current = swiper
                  }}
                  spaceBetween={30}
                  slidesPerView={1}
                  breakpoints={{
                      640: {
                          slidesPerView: 2,
                      },
                      1024: {
                          slidesPerView: 3,
                      },
                  }}
                  pagination={{ clickable: true }}
                  className="w-full h-full"
                >
                    {cats.slice(0, 6).map((cat) => (
                      <SwiperSlide key={cat.id}>
                          <Link href={`/cat-profile/${encodeURIComponent(cat.name)}`}>
                              <div className="cat-card cat-hover-lift cursor-pointer h-full group">
                                  <div className="relative h-56 w-full overflow-hidden rounded-t-3xl">
                                      <Image
                                        src={cat.mainImage || "/placeholder-cat.jpg"}
                                        alt={cat.name}
                                        fill
                                        className="object-cover transition-all duration-500 group-hover:scale-110"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                      
                                      {/* Floating paw prints on hover */}
                                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                          <GiPawPrint className="w-6 h-6 text-white animate-paw-wave" />
                                      </div>
                                  </div>
                                  <div className="p-6 text-gray-800">
                                      <div className="flex items-center mb-2">
                                          <GiCat className="w-5 h-5 text-red-500 mr-2" />
                                          <h3 className="text-2xl font-bold cat-text-gradient-warm group-hover:scale-105 transition-transform duration-300">{cat.name}</h3>
                                      </div>
                                      <p className="text-gray-700 line-clamp-2 mb-4">{cat.description || `${cat.breed} - ${cat.gender}`}</p>
                                      <div className="flex justify-between items-center">
                                          <span className="text-sm text-gray-500 flex items-center">
                                              <GiPawPrint className="w-3 h-3 mr-1 text-pink-500" />
                                              {cat.yearOfBirth ? `Born ${cat.yearOfBirth}` : "Age unknown"}
                                          </span>
                                          {cat.availability && (
                                            <span
                                              className={`text-sm px-3 py-1 rounded-full font-medium ${
                                                cat.availability === "Available"
                                                  ? "bg-green-100 text-green-800"
                                                  : cat.availability === "Reserved"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-red-100 text-red-800"
                                              }`}
                                            >
                                                {cat.availability}
                                            </span>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          </Link>
                      </SwiperSlide>
                    ))}
                </Swiper>
              )}

              {/* Navigation buttons */}
              {!isLoading && cats.length > 0 && (
                <div className="mt-4 flex justify-center">
                    <button
                      className="text-alabaster-600 bg-alabaster-900 hover:bg-seance-700 border border-alabaster-900 rounded-full h-12 w-12 flex items-center justify-center"
                      onClick={() => swiperRef.current?.slidePrev()}
                      aria-label="Previous slide"
                    >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                      className="text-alabaster-600 bg-alabaster-900 hover:bg-seance-700 border border-alabaster-900 rounded-full h-12 w-12 flex items-center justify-center ml-4"
                      onClick={() => swiperRef.current?.slideNext()}
                      aria-label="Next slide"
                    >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
              )}

              <p className="mt-12 text-lg">
                  Rescued from the streets of Spain, these felines are treated with love, care, and full vaccinations.
              </p>
              <p className="text-lg">They&#39;re now healthy and excited to meet their new owners!</p>
              <a href="/allcats" className="text-yellow-500 mt-4 inline-block text-lg hover:underline">
                  See all cats &gt;
              </a>
          </div>
      </section>
    )
}
