"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Footer from "@/components/layouts/Footer";
import Header from "@/components/layouts/Header";
import { cats } from "@/app/data/catsData";

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
    price: number;
};

type Category = {
    id: string;
    title: string;
    description: string;
    image: string;
    filter: string;
};

// Generate categories dynamically
const generateCategories = (cats: Cat[]): Category[] => [
    {
        id: "male",
        title: "Male Cats",
        description: `Explore our charming male cats. (${cats.filter((cat) => cat.gender === "Male").length} available)`,
        image: cats.find((cat) => cat.gender === "Male")?.mainImage || "/images/male-cats.jpg",
        filter: "male",
    },
    {
        id: "female",
        title: "Female Cats",
        description: `Meet our lovely female cats. (${cats.filter((cat) => cat.gender === "Female").length} available)`,
        image: cats.find((cat) => cat.gender === "Female")?.mainImage || "/images/female-cats.jpg",
        filter: "female",
    },
    {
        id: "kittens",
        title: "Kittens",
        description: `Discover our playful kittens. (${cats.filter((cat) => cat.category.toLowerCase() === "kitten").length} available)`,
        image: cats.find((cat) => cat.category.toLowerCase() === "kitten")?.mainImage || "/images/kittens.jpg",
        filter: "kitten",
    },
];

export default function CategoriesPage() {
    const router = useRouter();
    const categories = generateCategories(cats);

    const handleCategoryClick = (filter: string) => {
        router.push(`/cats?filter=${filter}`);
    };

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
                <div className="container mx-auto max-w-screen-xl py-12 px-4">
                    <h1 className="text-4xl font-extrabold text-gray-800 text-center mb-6">Explore Categories</h1>
                    <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-12">
                        Find the perfect companion—whether a playful kitten, a charming male cat, or an elegant female cat.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className="group bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer"
                                onClick={() => handleCategoryClick(category.filter)}
                            >
                                {/* Image Section */}
                                <div className="relative">
                                    <img
                                        src={category.image}
                                        alt={category.title}
                                        className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                </div>

                                {/* Content Section */}
                                <div className="p-6">
                                    <h2 className="text-2xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors duration-300 mb-3">
                                        {category.title}
                                    </h2>
                                    <p className="text-gray-600 mb-4">{category.description}</p>

                                    <button
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        View All
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
