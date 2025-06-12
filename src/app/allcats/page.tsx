"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Footer from "@/components/layouts/Footer"
import Header from "@/components/layouts/Header"
import { fetchAllCats } from "@/lib/api/catClient"
import type { CatProfile } from "@/lib/types/cat"
import { GiCat, GiPawPrint, GiPartyPopper } from "react-icons/gi"

type Category = {
    id: string
    title: string
    description: string
    image: string
    filter: string
}

export default function CategoriesPage() {
    const router = useRouter()
    const [cats, setCats] = useState<CatProfile[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchCats = async () => {
            try {
                setIsLoading(true)
                console.log("Fetching cats for allcats page...")
                const fetchedCats = await fetchAllCats(false) // false means don't include deleted cats
                console.log("Fetched cats for allcats page:", fetchedCats)

                // Check if fetchedCats is valid
                if (!Array.isArray(fetchedCats)) {
                    console.error("fetchedCats is not an array:", fetchedCats)
                    setCats([])
                } else {
                    setCats(fetchedCats)
                }
            } catch (err) {
                console.error("Error fetching cats:", err)
                setError("Failed to load cats. Please try again later.")
                setCats([]) // Ensure cats is an empty array on error
            } finally {
                setIsLoading(false)
            }
        }

        fetchCats()
    }, [])

    // Updated function to get the most recently added cat for each category
    const generateCategories = (cats: CatProfile[]): Category[] => {
        // Calculate current year to determine kitten status
        const currentYear = new Date().getFullYear()

        // Filter cats by gender and age
        const maleCats = cats.filter((cat) => cat.gender === "Male")
        const femaleCats = cats.filter((cat) => cat.gender === "Female")

        // Consider kittens as cats not older than 1 year (based on yearOfBirth or age)
        const kittens = cats.filter((cat) => {
            // If the cat has a yearOfBirth, check if it's within 1 year
            if (cat.yearOfBirth) {
                return currentYear - cat.yearOfBirth <= 1
            }
            // If no yearOfBirth but has age of 0 or 1, consider as kitten
            return cat.age === 0 || cat.age === 1
        })

        // Sort cats by createdAt timestamp (newest first)
        const sortByNewest = (a: CatProfile, b: CatProfile) => {
            // Handle different timestamp formats safely
            const getTimestamp = (cat: CatProfile) => {
                if (!cat.createdAt) return 0

                // If it's a Date object
                if (cat.createdAt instanceof Date) {
                    return cat.createdAt.getTime()
                }

                // If it has a toDate method (Firestore Timestamp)
                if (typeof cat.createdAt === "object" && cat.createdAt !== null && "toDate" in cat.createdAt) {
                    return cat.createdAt.toDate().getTime()
                }

                // If it's a number (timestamp)
                if (typeof cat.createdAt === "number") {
                    return cat.createdAt
                }

                // If it's a string that can be parsed as a date
                if (typeof cat.createdAt === "string") {
                    return new Date(cat.createdAt).getTime()
                }

                return 0
            }

            return getTimestamp(b) - getTimestamp(a)
        }

        // Sort each category by newest first
        const sortedMaleCats = [...maleCats].sort(sortByNewest)
        const sortedFemaleCats = [...femaleCats].sort(sortByNewest)
        const sortedKittens = [...kittens].sort(sortByNewest)

        // Debug logs to help identify issues
        console.log("All cats:", cats)
        console.log("Male cats:", maleCats)
        console.log("Female cats:", femaleCats)
        console.log("Kittens:", kittens)

        // Get the newest cat image for each category, or use default if none available
        const maleImage =
          sortedMaleCats.length > 0 && sortedMaleCats[0].mainImage ? sortedMaleCats[0].mainImage : "/tabby-sunbeam.png"

        const femaleImage =
          sortedFemaleCats.length > 0 && sortedFemaleCats[0].mainImage ? sortedFemaleCats[0].mainImage : "/calico-nap.png"

        const kittenImage =
          sortedKittens.length > 0 && sortedKittens[0].mainImage ? sortedKittens[0].mainImage : "/playful-tabby.png"

        return [
            {
                id: "male",
                title: "Male Cats",
                description: `Explore our charming male cats. (${maleCats.length} available)`,
                image: maleImage,
                filter: "male",
            },
            {
                id: "female",
                title: "Female Cats",
                description: `Meet our lovely female cats. (${femaleCats.length} available)`,
                image: femaleImage,
                filter: "female",
            },
            {
                id: "kittens",
                title: "Kittens",
                description: `Discover our playful kittens. (${kittens.length} available)`,
                image: kittenImage,
                filter: "kitten",
            },
        ]
    }

    const categories = generateCategories(cats)

    // Update the handleCategoryClick function to pass the correct filter parameters
    const handleCategoryClick = (filter: string) => {
        if (filter === "kitten") {
            // For kittens, we need to filter by age, not by category
            router.push(`/cats?age=kitten`)
        } else {
            // For gender-based filters
            router.push(`/cats?gender=${filter}`)
        }
    }

    if (isLoading) {
        return (
          <div className="min-h-screen cat-bg-pattern flex flex-col">
              <Header />
              <main className="flex-grow flex items-center justify-center">
                  <div className="text-center cat-glass rounded-3xl p-8">
                      <div className="animate-cat-bounce mb-4">
                          <GiCat className="h-16 w-16 cat-text-gradient-warm mx-auto" />
                      </div>
                      <p className="text-lg text-gray-600">Finding your purrfect companions...</p>
                  </div>
              </main>
              <Footer />
          </div>
        )
    }

    if (error) {
        return (
          <div className="min-h-screen cat-bg-pattern flex flex-col">
              <Header />
              <main className="flex-grow flex items-center justify-center">
                  <div className="text-center cat-glass rounded-3xl p-8 max-w-md">
                      <div className="animate-whisker-twitch mb-4">
                          <GiCat className="h-16 w-16 text-red-500 mx-auto" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Cat got your data</h2>
                      <p className="text-gray-600 mb-4">{error}</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="cat-button-primary"
                      >
                          Try Again 🐾
                      </button>
                  </div>
              </main>
              <Footer />
          </div>
        )
    }

    return (
      <div className="min-h-screen cat-bg-pattern relative overflow-hidden">
          {/* Floating Cat Elements */}
          <div className="cat-float top-20 left-10">
              <GiCat className="w-16 h-16 text-red-300" />
          </div>
          <div className="cat-float top-40 right-20 cat-float-delayed">
              <GiPawPrint className="w-12 h-12 text-blue-300" />
          </div>
          <div className="cat-float bottom-40 left-1/4 cat-float-slow">
              <GiPartyPopper className="w-14 h-14 text-orange-300" />
          </div>
          
          <Header />
          <main className="relative z-10">
              <div className="container mx-auto max-w-screen-xl py-16 px-4">
                  {/* Header Section */}
                  <div className="text-center mb-16">
                      <div className="animate-cat-bounce mb-6">
                          <GiCat className="w-20 h-20 cat-text-gradient-warm mx-auto" />
                      </div>
                      <h1 className="text-5xl md:text-6xl font-extrabold cat-text-gradient-cool mb-6">
                          Explore Categories
                      </h1>
                      <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                          Find your purrfect companion! Whether you're looking for a playful kitten, 
                          a charming male cat, or an elegant female cat, we have the perfect match waiting for you.
                          <span className="block mt-2 text-red-500 font-semibold">🏠 Your new family member is just a click away!</span>
                      </p>
                  </div>

                  {cats.length === 0 && !isLoading ? (
                    <div className="text-center cat-glass rounded-3xl p-8 max-w-md mx-auto">
                        <div className="animate-purr mb-4">
                            <GiCat className="h-16 w-16 text-yellow-500 mx-auto" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Cats Available</h2>
                        <p className="text-gray-600">All our furry friends are currently in loving homes! Please check back later for new arrivals.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {categories.map((category, index) => (
                          <div
                            key={category.id}
                            className="cat-card cat-hover-lift cursor-pointer group"
                            onClick={() => handleCategoryClick(category.filter)}
                            style={{ animationDelay: `${index * 0.2}s` }}
                          >
                              <div className="relative h-64 overflow-hidden rounded-t-3xl">
                                  <Image
                                    src={category.image || "/placeholder.svg?height=400&width=600&query=cat"}
                                    alt={category.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover transition-all duration-500 group-hover:scale-110"
                                    quality={80}
                                    priority={category.id === "male"}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              </div>

                              <div className="p-8">
                                  <div className="flex items-center mb-4">
                                      <div className="animate-paw-wave mr-3">
                                          {category.id === 'male' && <GiCat className="w-8 h-8 text-blue-500" />}
                                          {category.id === 'female' && <GiCat className="w-8 h-8 text-pink-500" />}
                                          {category.id === 'kittens' && <GiPartyPopper className="w-8 h-8 text-orange-500" />}
                                      </div>
                                      <h2 className="text-2xl font-bold cat-text-gradient-warm group-hover:scale-105 transition-transform duration-300">
                                          {category.title}
                                      </h2>
                                  </div>
                                  <p className="text-gray-600 mb-6 leading-relaxed">{category.description}</p>

                                  <button
                                    className="w-full cat-button-secondary group-hover:scale-105 transition-transform duration-300"
                                    aria-label={`View all ${category.title}`}
                                  >
                                      <span className="flex items-center justify-center">
                                          View All
                                          <GiPawPrint className="ml-2 w-4 h-4 animate-paw-wave" />
                                      </span>
                                  </button>
                              </div>
                          </div>
                        ))}
                    </div>
                  )}
              </div>
          </main>
          <Footer />
      </div>
    )
}
