'use client';

import React, { useState } from 'react';
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import { cats } from "@/app/data/catsData";
import Spotlight, { SpotlightCard } from "@/components/elements/Spotlight"; // Adjust the path if necessary



type Cat = {
    id: number;
    alias: string;
    name: string;
    description: string;
    mainImage: string;
    images: string[];
    videos?: string[];
    gender: string;
    color: string;
    yearOfBirth: number;
};

export default function AllCats() {
    const [genderFilter, setGenderFilter] = useState<string | null>(null);
    const [colorFilter, setColorFilter] = useState<string | null>(null);
    const [yearFilter, setYearFilter] = useState<number | null>(null);

    const handleGenderFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setGenderFilter(e.target.value || null);
    };

    const handleColorFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setColorFilter(e.target.value || null);
    };

    const handleYearFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setYearFilter(e.target.value ? parseInt(e.target.value) : null);
    };

    const filteredCats = cats.filter(cat => {
        return (
            (!genderFilter || cat.gender === genderFilter) &&
            (!colorFilter || cat.color === colorFilter) &&
            (!yearFilter || cat.yearOfBirth === yearFilter)
        );
    });

    const redirectToProfile = (alias: string) => {
        window.location.href = `/cat-profile/${alias}`;
    };

    // Get all unique years from cats data
    const uniqueYears = Array.from(new Set(cats.map(cat => cat.yearOfBirth))).sort((a, b) => b - a);

    return (
        <>
            <Header />
            <div className="bg-gray-200 min-h-screen p-4">
                <div className="container mx-auto max-w-screen-xl py-20 mt-18 p-4">
                    <h1 className="text-4xl text-center mb-4 font-bold">Meet Our Cats</h1>

                    <div className="flex flex-col md:flex-row">
                        {/* Filters - responsive layout */}
                        <div className="w-full md:w-1/5 bg-white shadow-md rounded-lg p-4 mb-6 md:mb-0 mr-0 md:mr-6">
                            <h2 className="text-2xl mb-4 font-bold text-center md:text-left">Filters</h2>
                            <div className="mb-4">
                                <label className="block text-lg font-semibold text-gray-600 mb-2">Filter by Gender:</label>
                                <select
                                    value={genderFilter || ''}
                                    onChange={handleGenderFilterChange}
                                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-lg font-semibold text-gray-600 mb-2">Filter by Color:</label>
                                <select
                                    value={colorFilter || ''}
                                    onChange={handleColorFilterChange}
                                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All</option>
                                    <option value="White">White</option>
                                    <option value="Orange">Orange</option>
                                    <option value="Orange and black">Orange and Black</option>
                                    <option value="Brown">Brown</option>
                                    <option value="Black">Black</option>
                                    <option value="Gray">Gray</option>
                                    <option value="Golden">Golden</option>
                                    <option value="White with black spots">White with Black Spots</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-lg font-semibold text-gray-600 mb-2">Filter by Year of Birth:</label>
                                <select
                                    value={yearFilter || ''}
                                    onChange={handleYearFilterChange}
                                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All</option>
                                    {uniqueYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Cat Cards */}
                        <div className="w-full md:w-4/5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {filteredCats.map((cat: Cat) => (
                                    <Spotlight key={cat.id}>
                                        <SpotlightCard
                                            className="bg-white shadow-md rounded-lg p-3 hover:shadow-lg transition-shadow duration-300 relative group"
                                        >
                                            <div
                                                className="cursor-pointer"
                                                onClick={() => redirectToProfile(cat.alias)}
                                            >
                                                <img
                                                    src={cat.mainImage}
                                                    alt={cat.name}
                                                    className="w-full h-36 object-cover rounded-lg mb-3 transition-transform duration-300 hover:scale-105"
                                                />
                                            </div>

                                            {/* Name (always visible) */}
                                            <h2 className="text-lg font-bold text-center mb-1">{cat.name}</h2>

                                            {/* Hover content (hidden by default, visible on hover) */}
                                            <div
                                                className="absolute inset-0 bg-black bg-opacity-75 text-white p-4 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                                                <p className="mb-1">{cat.description}</p>
                                                <p className="mb-1">Gender: {cat.gender}</p>
                                                <p className="mb-1">Color: {cat.color}</p>
                                                <p className="mb-1">Year of Birth: {cat.yearOfBirth}</p>
                                                <div className="flex justify-center">
                                                    <button
                                                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1.5 rounded-full text-sm transition-colors duration-300"
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
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}
