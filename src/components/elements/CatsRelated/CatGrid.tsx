"use client"

import type { CatProfile } from "@/lib/types/cat"
import PerformanceImage from "@/components/ui/performance-image"

type CatGridProps = {
    displayedCats: CatProfile[]
    redirectToProfile: (alias: string) => void
}

const CatGrid = ({ displayedCats, redirectToProfile }: CatGridProps) => {
    const getAvailabilityColor = (availability: string) => {
        switch (availability.toLowerCase()) {
            case 'available':
                return 'bg-green-500 text-white'
            case 'reserved':
                return 'bg-yellow-500 text-white'
            case 'sold':
                return 'bg-red-500 text-white'
            default:
                return 'bg-indigo-500 text-white'
        }
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 overflow-y-auto">
            {displayedCats.map((cat, index) => (
                <div
                    key={cat.id}
                    className="cat-card group cursor-pointer hover:scale-105 transition-all duration-500 h-full flex flex-col"
                    onClick={() => redirectToProfile(cat.name || cat.id)}
                    style={{
                        animationDelay: `${index * 50}ms`,
                        transform: 'translateY(0)',
                        opacity: 1
                    }}
                >
                    {/* Gradient Top Bar */}
                    <div className="h-1 bg-gradient-to-r from-pink-400 to-orange-400 rounded-t-3xl"></div>
                    
                    <div className="bg-white/90 backdrop-blur-sm rounded-b-3xl overflow-hidden flex-grow flex flex-col">
                        {/* Image Section */}
                        <div className="relative">
                            <PerformanceImage
                                src={cat.mainImage || "/placeholder.svg?height=300&width=400&query=cat"}
                                alt={`${cat.name} - British Shorthair cat profile photo`}
                                aspectRatio="4/3"
                                className="group-hover:scale-110 transition-transform duration-500"
                                quality={60}
                                priority={index < 2}
                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                            />
                            {/* Availability Badge */}
                            <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold ${getAvailabilityColor(cat.availability || "Available")} shadow-lg`}>
                                {cat.availability || "Available"}
                            </div>
                            {/* Heart Icon */}
                            <div className="absolute top-2 left-2 text-white/80 hover:text-red-400 transition-colors duration-300">
                                <span className="text-xl">🤍</span>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-4 flex-grow flex flex-col">
                            {/* Name and Gender */}
                            <div className="mb-3">
                                <h3 className="text-lg font-bold text-gray-800 truncate group-hover:text-pink-600 transition-colors duration-300">
                                    {cat.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.gender === "Male" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}`}>
                                        {cat.gender === "Male" ? "♂ Male" : "♀ Female"}
                                    </span>
                                    <span className="text-gray-500 text-xs">•</span>
                                    <span className="text-gray-600 text-sm truncate">{cat.breed || "Mixed Breed"}</span>
                                </div>
                            </div>

                            {/* Health Badges */}
                            <div className="flex flex-wrap gap-1 mb-3">
                                {cat.isVaccinated && (
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium flex items-center">
                                        💉 Vaccinated
                                    </span>
                                )}
                                {cat.isMicrochipped && (
                                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium flex items-center">
                                        🔍 Chipped
                                    </span>
                                )}
                                {cat.isCastrated && (
                                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium flex items-center">
                                        ✂️ Neutered
                                    </span>
                                )}
                            </div>

                            {/* Age and Color */}
                            <div className="mt-auto pt-2 border-t border-gray-100">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 flex items-center">
                                        🎂 {cat.yearOfBirth
                                            ? `Born ${cat.yearOfBirth}`
                                            : cat.age !== undefined
                                                ? `${cat.age} year${cat.age !== 1 ? "s" : ""}`
                                                : "Age unknown"}
                                    </span>
                                    {cat.color && (
                                        <span className="text-gray-600 text-xs bg-gray-100 px-2 py-1 rounded-full">
                                            🎨 {cat.color}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* View Profile Button */}
                            <div className="mt-3">
                                <div className="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-white py-2 px-4 rounded-xl text-center text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                    View Profile 🐾
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default CatGrid
