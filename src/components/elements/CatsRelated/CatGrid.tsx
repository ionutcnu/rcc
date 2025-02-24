"use client";

import React from "react";
import Image from "next/image";
import Spotlight, { SpotlightCard } from "@/components/elements/Spotlight";
import { GiMale, GiFemale } from "react-icons/gi";
import { MdPalette, MdCake } from "react-icons/md";

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
    availability: "Available" | "Reserved" | "Stays in cattery";
};

type CatGridProps = {
    displayedCats: Cat[];
    redirectToProfile: (alias: string) => void;
};

export default function CatGrid({ displayedCats, redirectToProfile }: CatGridProps) {
    if (displayedCats.length === 0) {
        return (
            <div className="text-center py-12 px-4">
                <Image
                    src="/empty-state.svg"
                    alt="No cats found"
                    width={200}
                    height={200}
                    className="mx-auto mb-6"
                />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No furry friends found!
                </h3>
                <p className="text-gray-600 mb-4">
                    Try adjusting your search filters or check back later.
                </p>
                <button
                    className="bg-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:bg-indigo-700 transition-colors"
                    onClick={() => {/* Add clear filters logic */}}
                >
                    Clear Filters
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4 sm:px-0">
            {displayedCats.map((cat) => (
                <Spotlight key={cat.id}>
                    <SpotlightCard
                        className="bg-white shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group w-full max-w-xs mx-auto"
                    >
                        {/* Image Section */}
                        <div
                            className="relative cursor-pointer overflow-hidden aspect-square"
                            onClick={() => redirectToProfile(cat.alias)}
                        >
                            <Image
                                src={cat.mainImage}
                                alt={`Photo of ${cat.name}`}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>

                        {/* Content Section */}
                        <div className="p-5 space-y-4">
                            {/* Status Badges */}
                            <div className="flex justify-between items-start gap-2">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {cat.name}
                                </h2>
                                <div className="flex flex-col items-end gap-1">
                                    <span
                                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                            cat.availability === 'Available' ? 'bg-green-500' :
                                                cat.availability === 'Reserved' ? 'bg-orange-500' :
                                                    'bg-purple-500'
                                        } text-white`}
                                    >
                                        {(cat.availability?.charAt(0)?.toUpperCase() ?? '') +
                                            (cat.availability?.slice(1) ?? '')}
                                    </span>
                                    <span
                                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                            cat.isCastrated
                                                ? "bg-green-600 text-white"
                                                : "bg-red-600 text-white"
                                        }`}
                                    >
                                        {cat.isCastrated ? "Castrated" : "Not Castrated"}
                                    </span>
                                </div>
                            </div>

                            {/*/!* Price *!/*/}
                            {/*<div className="text-2xl font-bold text-indigo-600">*/}
                            {/*    €{cat.price.toLocaleString()}*/}
                            {/*</div>*/}

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center space-x-2">
                                    {cat.gender === 'Male' ? (
                                        <GiMale className="w-5 h-5 text-blue-600" />
                                    ) : (
                                        <GiFemale className="w-5 h-5 text-pink-600" />
                                    )}
                                    <span className="text-gray-700">{cat.gender}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-gray-700"> Color: <b> {cat.color}</b></span>
                                </div>
                                <div className="flex items-center justify-center space-x-2 w-full col-span-2">
                                    <MdCake className="w-7 h-7 text-gray-600" />
                                    <span className="text-gray-700">Born {cat.yearOfBirth}</span>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <button
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-md transition-all duration-300 active:scale-95"
                                onClick={() => redirectToProfile(cat.alias)}
                            >
                                View Profile
                            </button>
                        </div>
                    </SpotlightCard>
                </Spotlight>
            ))}
        </div>
    );
}