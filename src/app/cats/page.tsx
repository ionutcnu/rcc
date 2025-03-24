"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Footer from "@/components/layouts/Footer";
import Header from "@/components/layouts/Header";
import { cats } from "@/app/data/catsData";
import FilterSidebar from "@/components/elements/CatsRelated/FilterSidebar";
import CatGrid from "@/components/elements/CatsRelated/CatGrid";
import PaginationSection from "@/components/elements/CatsRelated/PaginationSection";

// A single place for the Cat type:
export type Cat = {
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
    isCastrated: boolean;
    availability: string;  // or union if you prefer
};

export default function Page() {
    const searchParams = useSearchParams();
    const filterParam = searchParams.get("filter");

    // 1) Filter states
    const [genderFilter, setGenderFilter] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [colorFilter, setColorFilter] = useState<string | null>(null);
    const [availableCategoryFilter, setAvailableCategoryFilter] = useState<string | null>(null);
    const [yearFilter, setYearFilter] = useState<number | null>(null);
    const [breedFilter, setBreedFilter] = useState<string | null>(null);
    const [vaccinationFilter, setVaccinationFilter] = useState<boolean | null>(null);
    const [microchipFilter, setMicrochipFilter] = useState<boolean | null>(null);
    const [priceOrder, setPriceOrder] = useState<string>("");

    // 2) Pagination states
    const [catsPerPage, setCatsPerPage] = useState<number>(9);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // 3) Mobile filter toggling
    const [showFilters, setShowFilters] = useState(false);

    // Pre-set filters if we have ?filter=male/female/kitten
    useEffect(() => {
        if (filterParam === "male" || filterParam === "female") {
            setGenderFilter(filterParam.charAt(0).toUpperCase() + filterParam.slice(1));
            setCategoryFilter(null);
        } else if (filterParam === "kitten") {
            setCategoryFilter("Kitten");
            setGenderFilter(null);
        } else {
            setGenderFilter(null);
            setCategoryFilter(null);
        }
    }, [filterParam]);

    // 4) “Clear all” resets everything
    const clearAllFilters = () => {
        setGenderFilter(null);
        setCategoryFilter(null);
        setColorFilter(null);
        setYearFilter(null);
        setBreedFilter(null);
        setVaccinationFilter(null);
        setMicrochipFilter(null);
        setAvailableCategoryFilter(null);
        setPriceOrder("");
        setCurrentPage(1);
    };

    // 5) Filter logic
    const filteredCats = useMemo(() => {
        let result = cats.filter((cat) => {
            return (
                (!genderFilter || cat.gender.toLowerCase() === genderFilter.toLowerCase()) &&
                (!categoryFilter || cat.category.toLowerCase() === categoryFilter.toLowerCase()) &&
                (!colorFilter || cat.color.toLowerCase() === colorFilter.toLowerCase()) &&
                (!yearFilter || cat.yearOfBirth === yearFilter) &&
                (!breedFilter || cat.breed.toLowerCase() === breedFilter.toLowerCase()) &&
                (vaccinationFilter === null || cat.isVaccinated === vaccinationFilter) &&
                (microchipFilter === null || cat.isMicrochipped === microchipFilter) &&
                (!availableCategoryFilter ||
                    cat.availability.toLowerCase() === availableCategoryFilter.toLowerCase())
            );
        });

        // Price order
        if (priceOrder === "asc") {
            result = [...result].sort((a, b) => a.price - b.price);
        } else if (priceOrder === "desc") {
            result = [...result].sort((a, b) => b.price - a.price);
        }
        return result;
    }, [
        genderFilter,
        categoryFilter,
        colorFilter,
        availableCategoryFilter,
        yearFilter,
        breedFilter,
        vaccinationFilter,
        microchipFilter,
        priceOrder,
    ]);

    // 6) Pagination
    const totalPages = Math.ceil(filteredCats.length / catsPerPage);
    const displayedCats = filteredCats.slice(
        (currentPage - 1) * catsPerPage,
        currentPage * catsPerPage
    );

    // 7) Simple redirect function
    const redirectToProfile = (alias: string) => {
        window.location.href = `/cat-profile/${alias}`;
    };

    // 8) Unique options
    const uniqueYears = Array.from(new Set(cats.map((cat) => cat.yearOfBirth))).sort(
        (a, b) => b - a
    );
    const uniqueBreeds = Array.from(new Set(cats.map((cat) => cat.breed)));
    const uniqueCategories = Array.from(new Set(cats.map((cat) => cat.category)));

    return (
        <div className="bg-gray-100 min-h-screen">
            <Header />

            <div className="container mx-auto max-w-screen-xl py-6 px-4 md:px-0">
                <h1 className="text-4xl font-bold text-gray-800 text-center mb-6">
                    Meet Our Cats
                </h1>

                {/* MOBILE "SHOW FILTERS" BUTTON */}
                <div className="block md:hidden mb-4 text-center">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 inline-block"
                    >
                        {showFilters ? "Hide Filters" : "Show Filters"}
                    </button>
                </div>


                <div className="flex flex-col md:flex-row gap-6">
                    {/* Collapsible sidebar on mobile */}
                    {(showFilters || window.innerWidth >= 768) && (
                        <div className="w-full md:w-1/4">
                            <FilterSidebar
                                clearAllFilters={clearAllFilters}
                                priceOrder={priceOrder}
                                handlePriceOrderChange={(e) => setPriceOrder(e.target.value)}
                                genderFilter={genderFilter}
                                handleGenderFilterChange={(e) =>
                                    setGenderFilter(e.target.value || null)
                                }
                                colorFilter={colorFilter}
                                handleColorFilterChange={(e) =>
                                    setColorFilter(e.target.value || null)
                                }
                                yearFilter={yearFilter}
                                handleYearFilterChange={(e) =>
                                    setYearFilter(e.target.value ? parseInt(e.target.value) : null)
                                }
                                uniqueYears={uniqueYears}
                                breedFilter={breedFilter}
                                handleBreedFilterChange={(e) => setBreedFilter(e.target.value || null)}
                                uniqueBreeds={uniqueBreeds}
                                categoryFilter={categoryFilter}
                                handleCategoryFilterChange={(e) =>
                                    setCategoryFilter(e.target.value || null)
                                }
                                uniqueCategories={uniqueCategories}
                                availableCategoryFilter={availableCategoryFilter}
                                handleAvailableCategoryChange={(e) =>
                                    setAvailableCategoryFilter(e.target.value || null)
                                }
                                vaccinationFilter={vaccinationFilter}
                                handleVaccinationFilterChange={(e) =>
                                    setVaccinationFilter(
                                        e.target.value === "Yes"
                                            ? true
                                            : e.target.value === "No"
                                                ? false
                                                : null
                                    )
                                }
                                microchipFilter={microchipFilter}
                                handleMicrochipFilterChange={(e) =>
                                    setMicrochipFilter(
                                        e.target.value === "Yes"
                                            ? true
                                            : e.target.value === "No"
                                                ? false
                                                : null
                                    )
                                }
                                catsPerPage={catsPerPage}
                                handleCatsPerPageChange={(e) =>
                                    setCatsPerPage(parseInt(e.target.value))
                                }
                            />
                        </div>
                    )}

                    {/* Main content */}
                    <div className="w-full md:w-3/4">
                        <CatGrid displayedCats={displayedCats} redirectToProfile={redirectToProfile} />

                        {totalPages > 1 && (
                            <PaginationSection
                                currentPage={currentPage}
                                totalPages={totalPages}
                                catsPerPage={catsPerPage}
                                filteredCatsLength={filteredCats.length}
                                setCurrentPage={setCurrentPage}
                            />
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
