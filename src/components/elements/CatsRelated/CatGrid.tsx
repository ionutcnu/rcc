"use client";

import React from "react";
import Spotlight, { SpotlightCard } from "@/components/elements/Spotlight";

type Cat = {
    id: number;
    alias: string;
    name: string;
    mainImage: string;
    images: string[];
    videos?: string[];
    gender: string;
    color: string;
    yearOfBirth: number;
    breed: string;
    category: string;
    isVaccinated: boolean;
    isMicrochipped: boolean;
    isCastrated: boolean;
    price: number;
};

type CatGridProps = {
    displayedCats: Cat[];
    redirectToProfile: (alias: string) => void;
};

export default function CatGrid({ displayedCats, redirectToProfile }: CatGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {displayedCats.map((cat) => (
                <Spotlight key={cat.id}>
                    <SpotlightCard
                        className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300 group w-64"
                    >
                        {/* Image Section */}
                        <div
                            className="relative cursor-pointer overflow-hidden"
                            onClick={() => redirectToProfile(cat.alias)}
                        >
                            <img
                                src={cat.mainImage}
                                alt={`Photo of ${cat.name}`}
                                className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        {/* Content Section */}
                        <div className="p-4">
                            {/* Castration Badge */}
                            <div className="text-center mb-3">
                                <span
                                    className={`inline-block px-3 py-1 text-sm font-medium text-white rounded-full ${
                                        cat.isCastrated ? "bg-green-500" : "bg-red-500"
                                    }`}
                                >
                                    {cat.isCastrated ? "Castrated" : "Not Castrated"}
                                </span>
                            </div>

                            {/* Cat Name and Price */}
                            <div className="text-center mb-3">
                                <h2 className="text-md font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                                    {cat.name}
                                </h2>
                                {/*<h3 className="text-sm font-semibold text-gray-700 mt-1">${cat.price}</h3>*/}
                                {/*removed price from cat card for now*/}
                            </div>

                            {/* Cat Details */}
                            <div className="text-gray-600 text-sm space-y-1 text-center leading-relaxed">
                                <p>
                                    <span className="font-semibold text-gray-800">Gender:</span> {cat.gender}
                                </p>
                                <p>
                                    <span className="font-semibold text-gray-800">Color:</span> {cat.color}
                                </p>
                                <p>
                                    <span className="font-semibold text-gray-800">Year of Birth:</span> {cat.yearOfBirth}
                                </p>
                            </div>

                            {/* Call-to-Action */}
                            <div className="flex justify-center mt-4">
                                <button
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full font-medium shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    onClick={() => redirectToProfile(cat.alias)}
                                >
                                    View Profile
                                </button>
                            </div>
                        </div>
                    </SpotlightCard>
                </Spotlight>
            ))}
        </div>
    );
}
