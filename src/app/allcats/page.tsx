"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Footer from "@/components/layouts/Footer"
import Header from "@/components/layouts/Header"
import { getAllCats } from "@/lib/firebase/catService"
import type { CatProfile } from "@/lib/types/cat"

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
                const fetchedCats = await getAllCats(false) // false means don't include deleted cats
                setCats(fetchedCats)
            } catch (err) {
                console.error("Error fetching cats:", err)
                setError("Failed to load cats. Please try again later.")
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
            <div className="bg-gray-50 min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
                        <p className="text-lg text-gray-600">Loading categories...</p>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-gray-50 min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow flex items-center justify-center">
                    <div className="text-center bg-red-50 p-6 rounded-lg shadow-md max-w-md">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 text-red-500 mx-auto mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium"
                        >
                            Try Again
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
                <div className="container mx-auto max-w-screen-xl py-12 px-4">
                    <h1 className="text-4xl font-extrabold text-gray-800 text-center mb-6">Explore Categories</h1>
                    <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-12">
                        Find the perfect companion—whether a playful kitten, a charming male cat, or an elegant female cat.
                    </p>

                    {cats.length === 0 && !isLoading ? (
                        <div className="text-center bg-yellow-50 p-6 rounded-lg shadow-md max-w-md mx-auto">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-12 w-12 text-yellow-500 mx-auto mb-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Cats Available</h2>
                            <p className="text-gray-600">There are currently no cats in our database. Please check back later.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="group bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer"
                                    onClick={() => handleCategoryClick(category.filter)}
                                >
                                    <div className="relative h-56">
                                        <Image
                                            src={category.image || "/placeholder.svg?height=400&width=600&query=cat"}
                                            alt={category.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            quality={80}
                                            priority={category.id === "male"} // Optional: Prioritize above-the-fold images
                                        />
                                    </div>

                                    <div className="p-6">
                                        <h2 className="text-2xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors duration-300 mb-3">
                                            {category.title}
                                        </h2>
                                        <p className="text-gray-600 mb-4">{category.description}</p>

                                        <button
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            aria-label={`View all ${category.title}`}
                                        >
                                            View All
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
