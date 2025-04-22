"use client"

import Image from "next/image"
import type { CatProfile } from "@/lib/types/cat"

type CatGridProps = {
    displayedCats: CatProfile[]
    redirectToProfile: (alias: string) => void
}

const CatGrid = ({ displayedCats, redirectToProfile }: CatGridProps) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto">
            {displayedCats.map((cat) => (
                <div
                    key={cat.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-indigo-200 hover:scale-[1.02]"
                    onClick={() => redirectToProfile(cat.name || cat.id)}
                >
                    <div className="relative h-32">
                        <Image
                            src={cat.mainImage || "/placeholder.svg?height=300&width=400&query=cat"}
                            alt={cat.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                            quality={70}
                        />
                        <div className="absolute top-0 right-0 bg-indigo-600 text-white px-2 py-0.5 m-1.5 rounded-full text-xs font-medium">
                            {cat.availability || "Available"}
                        </div>
                    </div>

                    <div className="p-3 border-t border-gray-100">
                        <h3 className="text-sm font-bold text-gray-800 truncate">{cat.name}</h3>
                        <div className="flex items-center mb-1.5">
              <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${cat.gender === "Male" ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"}`}
              >
                {cat.gender}
              </span>
                            <span className="mx-1 text-gray-400 text-xs">•</span>
                            <span className="text-gray-600 text-xs truncate">{cat.breed || "Mixed Breed"}</span>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-1.5">
                            {cat.isVaccinated && (
                                <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full">Vacc</span>
                            )}
                            {cat.isMicrochipped && (
                                <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">Chip</span>
                            )}
                            {cat.isCastrated && (
                                <span className="bg-purple-100 text-purple-800 text-xs px-1.5 py-0.5 rounded-full">Cast</span>
                            )}
                        </div>

                        <div className="flex justify-between items-center pt-1 border-t border-gray-50">
              <span className="text-gray-600 text-xs">
                {cat.yearOfBirth
                    ? `Born ${cat.yearOfBirth}`
                    : cat.age !== undefined
                        ? `${cat.age} year${cat.age !== 1 ? "s" : ""}`
                        : ""}
              </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default CatGrid
