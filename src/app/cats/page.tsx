// src/components/elements/AllCats.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import Spotlight, { SpotlightCard } from "@/components/elements/Spotlight"; // Adjust the path if necessary
import { useTranslation } from 'react-i18next';

// Import both data files
import { catsEn } from '@/app/data/catsData.en';
import { catsRo } from '@/app/data/catsData.ro';

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
    breed: string;
    category: string;
    isVaccinated: boolean;
    isMicrochipped: boolean;
    price: number;
};

export default function AllCats() {
    const { t, i18n } = useTranslation();
    const [cats, setCats] = useState<Cat[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [genderFilter, setGenderFilter] = useState<string | null>(null);
    const [colorFilter, setColorFilter] = useState<string | null>(null);
    const [yearFilter, setYearFilter] = useState<number | null>(null);
    const [breedFilter, setBreedFilter] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [vaccinationFilter, setVaccinationFilter] = useState<boolean | null>(null);
    const [microchipFilter, setMicrochipFilter] = useState<boolean | null>(null);
    const [priceOrder, setPriceOrder] = useState<string>(''); // New state for price sorting
    const [catsPerPage, setCatsPerPage] = useState<number>(9); // Default to 9 cats per page
    const [currentPage, setCurrentPage] = useState<number>(1);

    useEffect(() => {
        const fetchCats = () => {
            try {
                const currentLang = i18n.language;
                const selectedCats = currentLang === 'ro' ? catsRo : catsEn;
                setCats(selectedCats);
                setLoading(false);
            } catch (error) {
                setError(t('all_cats.loading'));
                setLoading(false);
            }
        };

        fetchCats();
    }, [i18n.language, t]);

    // Filter Handlers
    const handleGenderFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setGenderFilter(e.target.value || null);
    };

    const handleColorFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setColorFilter(e.target.value || null);
    };

    const handleYearFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setYearFilter(e.target.value ? parseInt(e.target.value) : null);
    };

    const handleBreedFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setBreedFilter(e.target.value || null);
    };

    const handleCategoryFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCategoryFilter(e.target.value || null);
    };

    const handleVaccinationFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'Yes') {
            setVaccinationFilter(true);
        } else if (value === 'No') {
            setVaccinationFilter(false);
        } else {
            setVaccinationFilter(null);
        }
    };

    const handleMicrochipFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'Yes') {
            setMicrochipFilter(true);
        } else if (value === 'No') {
            setMicrochipFilter(false);
        } else {
            setMicrochipFilter(null);
        }
    };

    const handlePriceOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPriceOrder(e.target.value);
    };

    const handleCatsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCatsPerPage(parseInt(e.target.value));
        setCurrentPage(1); // Reset to the first page when changing cats per page
    };

    const clearAllFilters = () => {
        setGenderFilter(null);
        setColorFilter(null);
        setYearFilter(null);
        setBreedFilter(null);
        setCategoryFilter(null);
        setVaccinationFilter(null);
        setMicrochipFilter(null);
        setPriceOrder(''); // Reset price order filter
        setCurrentPage(1);
    };

    // Filtered and Sorted Cats
    let filteredCats = cats.filter(cat => {
        return (
            (!genderFilter || cat.gender === genderFilter) &&
            (!colorFilter || cat.color === colorFilter) &&
            (!yearFilter || cat.yearOfBirth === yearFilter) &&
            (!breedFilter || cat.breed === breedFilter) &&
            (!categoryFilter || cat.category === categoryFilter) &&
            (vaccinationFilter === null || cat.isVaccinated === vaccinationFilter) &&
            (microchipFilter === null || cat.isMicrochipped === microchipFilter)
        );
    });

    // Sort by Price
    if (priceOrder === 'asc') {
        filteredCats = [...filteredCats].sort((a, b) => a.price - b.price);
    } else if (priceOrder === 'desc') {
        filteredCats = [...filteredCats].sort((a, b) => b.price - a.price);
    }

    const totalPages = Math.ceil(filteredCats.length / catsPerPage);
    const displayedCats = filteredCats.slice((currentPage - 1) * catsPerPage, currentPage * catsPerPage);

    const redirectToProfile = (alias: string) => {
        window.location.href = `/cat-profile/${alias}`;
    };

    // Get all unique years from cats data
    const uniqueYears = Array.from(new Set(cats.map(cat => cat.yearOfBirth))).sort((a, b) => b - a);
    // Get all unique breeds from cats data
    const uniqueBreeds = Array.from(new Set(cats.map(cat => cat.breed)));
    // Get all unique categories from cats data
    const uniqueCategories = Array.from(new Set(cats.map(cat => cat.category)));

    if (loading) {
        return (
            <>
                <Header />
                <div className="flex justify-center items-center min-h-screen">
                    <p>{t('all_cats.loading')}</p>
                </div>
                <Footer />
            </>
        );
    }

    if (error) {
        return (
            <>
                <Header />
                <div className="flex justify-center items-center min-h-screen">
                    <p>{error}</p>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="bg-gray-200 min-h-screen p-4">
                <div className="container mx-auto max-w-screen-xl py-20 mt-18 p-4">
                    <h1 className="text-4xl text-center text-black mb-4 font-bold">{t('all_cats.title')}</h1>

                    <div className="flex flex-col md:flex-row">
                        {/* Filters - responsive layout */}
                        <div className="w-full md:w-1/5 bg-white shadow-md rounded-lg p-4 mb-6 md:mb-0 mr-0 md:mr-6">
                            {/* Clear All Filters Button */}
                            <div className="mb-4">
                                <button
                                    onClick={clearAllFilters}
                                    className="w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    {t('all_cats.clear_all_filters')}
                                </button>
                            </div>

                            {/* Price Sorting Filter */}
                            <div className="mb-4">
                                <label className="block text-lg font-semibold text-gray-600 mb-2">
                                    {t('all_cats.sort_by_price')}
                                </label>
                                <select
                                    value={priceOrder}
                                    onChange={handlePriceOrderChange}
                                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">{t('all_cats.price_none')}</option>
                                    <option value="asc">{t('all_cats.price_asc')}</option>
                                    <option value="desc">{t('all_cats.price_desc')}</option>
                                </select>
                            </div>

                            {/* Gender Filter */}
                            <div className="mb-4">
                                <label className="block text-lg font-semibold text-gray-600 mb-2">
                                    {t('all_cats.filter_by_gender')}
                                </label>
                                <select
                                    value={genderFilter || ''}
                                    onChange={handleGenderFilterChange}
                                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">{t('all_cats.gender_all')}</option>
                                    <option value="Male">{t('all_cats.gender_male')}</option>
                                    <option value="Female">{t('all_cats.gender_female')}</option>
                                </select>
                            </div>

                            {/* Color Filter */}
                            <div className="mb-4">
                                <label className="block text-lg font-semibold text-gray-600 mb-2">
                                    {t('all_cats.filter_by_color')}
                                </label>
                                <select
                                    value={colorFilter || ''}
                                    onChange={handleColorFilterChange}
                                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">{t('all_cats.color_all')}</option>
                                    <option value="White">{t('all_cats.color_white')}</option>
                                    <option value="Orange">{t('all_cats.color_orange')}</option>
                                    <option value="Orange and Black">{t('all_cats.color_orange_black')}</option>
                                    <option value="Brown">{t('all_cats.color_brown')}</option>
                                    <option value="Black">{t('all_cats.color_black')}</option>
                                    <option value="Gray">{t('all_cats.color_gray')}</option>
                                    <option value="Golden">{t('all_cats.color_golden')}</option>
                                    <option value="White with Black Spots">{t('all_cats.color_white_black_spots')}</option>
                                </select>
                            </div>

                            {/* Year of Birth Filter */}
                            <div className="mb-4">
                                <label className="block text-lg font-semibold text-gray-600 mb-2">
                                    {t('all_cats.filter_by_year')}
                                </label>
                                <select
                                    value={yearFilter || ''}
                                    onChange={handleYearFilterChange}
                                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">{t('all_cats.all')}</option>
                                    {uniqueYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Breed Filter */}
                            <div className="mb-4">
                                <label className="block text-lg font-semibold text-gray-600 mb-2">
                                    {t('all_cats.filter_by_breed')}
                                </label>
                                <select
                                    value={breedFilter || ''}
                                    onChange={handleBreedFilterChange}
                                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">{t('all_cats.all')}</option>
                                    {uniqueBreeds.map(breed => (
                                        <option key={breed} value={breed}>{breed}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Category Filter */}
                            <div className="mb-4">
                                <label className="block text-lg font-semibold text-gray-600 mb-2">
                                    {t('all_cats.filter_by_category')}
                                </label>
                                <select
                                    value={categoryFilter || ''}
                                    onChange={handleCategoryFilterChange}
                                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">{t('all_cats.all')}</option>
                                    {uniqueCategories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Vaccination Filter */}
                            <div className="mb-4">
                                <label className="block text-lg font-semibold text-gray-600 mb-2">
                                    {t('all_cats.filter_by_vaccinated')}
                                </label>
                                <select
                                    value={vaccinationFilter === null ? '' : vaccinationFilter ? 'Yes' : 'No'}
                                    onChange={handleVaccinationFilterChange}
                                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">{t('all_cats.vaccinated_all')}</option>
                                    <option value="Yes">{t('all_cats.vaccinated_yes')}</option>
                                    <option value="No">{t('all_cats.vaccinated_no')}</option>
                                </select>
                            </div>

                            {/* Microchip Filter */}
                            <div className="mb-4">
                                <label className="block text-lg font-semibold text-gray-600 mb-2">
                                    {t('all_cats.filter_by_microchipped')}
                                </label>
                                <select
                                    value={microchipFilter === null ? '' : microchipFilter ? 'Yes' : 'No'}
                                    onChange={handleMicrochipFilterChange}
                                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">{t('all_cats.microchipped_all')}</option>
                                    <option value="Yes">{t('all_cats.microchipped_yes')}</option>
                                    <option value="No">{t('all_cats.microchipped_no')}</option>
                                </select>
                            </div>

                            {/* Cats Per Page */}
                            <div className="mb-4">
                                <label className="block text-lg font-semibold text-gray-600 mb-2">
                                    {t('all_cats.cats_per_page')}
                                </label>
                                <select
                                    value={catsPerPage}
                                    onChange={handleCatsPerPageChange}
                                    className="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="9">9</option>
                                    <option value="18">18</option>
                                    <option value="32">32</option>
                                </select>
                            </div>
                        </div>

                        {/* Cat Cards */}
                        <div className="w-full md:w-4/5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {displayedCats.map((cat: Cat) => (
                                    <Spotlight key={cat.id}>
                                        <SpotlightCard
                                            className="bg-white shadow-md rounded-lg p-5 hover:shadow-lg transition-shadow duration-300 relative group"
                                        >
                                            <div
                                                className="cursor-pointer"
                                                onClick={() => redirectToProfile(cat.alias)}
                                            >
                                                <img
                                                    src={cat.mainImage}
                                                    alt={cat.name}
                                                    className="w-full h-52 object-cover rounded-lg mb-4 transition-transform duration-300 hover:scale-105"
                                                />
                                            </div>

                                            {/* Name */}
                                            <h2 className="text-xl font-bold text-black text-center mb-2">{cat.name}</h2>

                                            {/* Price */}
                                            <h3 className="text-lg font-semibold text-center text-gray-700 mb-4">${cat.price}</h3>

                                            {/* Details */}
                                            <div className="text-gray-700 text-center font-bold text-base">
                                                <p className="mb-2"><strong>{t('all_cats.gender')}:</strong> {cat.gender}</p>
                                                <p className="mb-2"><strong>{t('all_cats.color')}:</strong> {cat.color}</p>
                                                <p className="mb-2"><strong>{t('all_cats.year_of_birth')}:</strong> {cat.yearOfBirth}</p>
                                            </div>

                                            {/* View Profile Button */}
                                            <div className="flex justify-center mt-4">
                                                <button
                                                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-full text-base transition-colors duration-300"
                                                    onClick={() => redirectToProfile(cat.alias)}
                                                >
                                                    {t('all_cats.view_profile')}
                                                </button>
                                            </div>
                                        </SpotlightCard>
                                    </Spotlight>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-between items-center mt-8">
                                    {/* Displaying the range of items shown */}
                                    <span className="text-sm text-gray-600">
                                        {`${(currentPage - 1) * catsPerPage + 1} - ${Math.min(currentPage * catsPerPage, filteredCats.length)} ${t('all_cats.of')} ${filteredCats.length}`}
                                    </span>

                                    <div className="flex items-center space-x-2">
                                        {/* Previous Button */}
                                        <button
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className={`px-3 py-2 rounded-lg ${currentPage === 1 ? 'bg-gray-300' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
                                        >
                                            {t('all_cats.previous')}
                                        </button>

                                        {/* Page Numbers */}
                                        {Array.from({ length: totalPages }, (_, index) => (
                                            <button
                                                key={index + 1}
                                                onClick={() => setCurrentPage(index + 1)}
                                                className={`px-3 py-2 rounded-lg ${currentPage === index + 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                            >
                                                {index + 1}
                                            </button>
                                        ))}

                                        {/* Next Button */}
                                        <button
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className={`px-3 py-2 rounded-lg ${currentPage === totalPages ? 'bg-gray-300' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
                                        >
                                            {t('all_cats.next')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}
