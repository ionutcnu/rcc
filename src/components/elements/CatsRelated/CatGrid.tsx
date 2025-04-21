"use client"
import Image from "next/image"
import Spotlight, { SpotlightCard } from "@/components/elements/Spotlight"
import { GiMale, GiFemale } from "react-icons/gi"
import { MdCake } from "react-icons/md"

type Cat = {
    id: number
    alias: string
    name: string
    mainImage: string
    images: string[]
    videos?: string[]
    gender: string
    color: string
    yearOfBirth: number
    breed: string
    category: string
    isVaccinated: boolean
    isMicrochipped: boolean
    isCastrated: boolean
    price: number
    availability: string
}

type CatGridProps = {
    displayedCats: Cat[]
    redirectToProfile: (alias: string) => void
}

export default function CatGrid({ displayedCats, redirectToProfile }: CatGridProps) {
    if (displayedCats.length === 0) {
        return (
            <div className="text-center py-8 px-4">
                <Image src="/empty-state.svg" alt="No cats found" width={150} height={150} className="mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No furry friends found!</h3>
                <p className="text-gray-600 mb-3">Try adjusting your search filters or check back later.</p>
                <button
                    className="bg-indigo-600 text-white px-4 py-2 rounded-full font-medium hover:bg-indigo-700 transition-colors"
                    onClick={() => {
                        /* Add clear filters logic */
                    }}
                >
                    Clear Filters
                </button>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 px-2 sm:px-0">
            {displayedCats.map((cat) => (
                <Spotlight key={cat.id}>
                    <SpotlightCard className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 group w-full mx-auto">
                        {/* Image Section - Smaller aspect ratio */}
                        <div
                            className="relative cursor-pointer overflow-hidden aspect-[4/3]"
                            onClick={() => redirectToProfile(cat.alias)}
                        >
                            <Image
                                src={cat.mainImage || "/placeholder.svg"}
                                alt={`Photo of ${cat.name}`}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Status Badge - Moved to overlay on image */}
                            <div className="absolute top-2 right-2">
                <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        cat.availability === "Available"
                            ? "bg-green-500"
                            : cat.availability === "Reserved"
                                ? "bg-orange-500"
                                : "bg-purple-500"
                    } text-white`}
                >
                  {(cat.availability?.charAt(0)?.toUpperCase() ?? "") + (cat.availability?.slice(1) ?? "")}
                </span>
                            </div>
                        </div>

                        {/* Content Section - Simplified */}
                        <div className="p-3 space-y-2">
                            {/* Name and Gender Icon */}
                            <div className="flex justify-between items-center">
                                <h2 className="text-base font-bold text-gray-900 truncate">{cat.name}</h2>
                                <div>
                                    {cat.gender === "Male" ? (
                                        <GiMale className="w-4 h-4 text-blue-600" />
                                    ) : (
                                        <GiFemale className="w-4 h-4 text-pink-600" />
                                    )}
                                </div>
                            </div>

                            {/* Compact Details */}
                            <div className="flex items-center justify-between text-xs text-gray-600">
                                <div className="flex items-center gap-1">
                                    <MdCake className="w-3 h-3" />
                                    <span>{cat.yearOfBirth}</span>
                                </div>
                                <span>{cat.color}</span>
                                <span className={cat.isCastrated ? "text-green-600" : "text-red-600"}>
                  {cat.isCastrated ? "Castrated" : "Not Castrated"}
                </span>
                            </div>

                            {/* View Button - Smaller */}
                            <button
                                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition-all duration-300"
                                onClick={() => redirectToProfile(cat.alias)}
                            >
                                View Profile
                            </button>
                        </div>
                    </SpotlightCard>
                </Spotlight>
            ))}
        </div>
    )
}
