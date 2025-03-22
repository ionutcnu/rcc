"use client";

import React from "react";

type FilterOptionProps = {
    label: string;
    value: string | number | null;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string | number | null; label: string }[];
};

const FilterOption = ({ label, value, onChange, options }: FilterOptionProps) => (
    <div className="mb-6">
        <label className="block text-sm font-medium text-gray-800 mb-2">{label}</label>
        <select
            value={value ?? ""}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-lg py-2 px-3 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-indigo-400 transition-all duration-300 shadow-sm"
        >
            {options.map((opt) => (
                <option key={opt.value ?? "null"} value={opt.value ?? ""}>
                    {opt.label}
                </option>
            ))}
        </select>
    </div>
);

type FilterSidebarProps = {
    clearAllFilters: () => void;
    priceOrder: string;
    handlePriceOrderChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    genderFilter: string | null;
    handleGenderFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    colorFilter: string | null;
    handleColorFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    yearFilter: number | null;
    handleYearFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    uniqueYears: number[];
    breedFilter: string | null;
    handleBreedFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    uniqueBreeds: string[];
    categoryFilter: string | null;
    handleCategoryFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    uniqueCategories: string[];
    availableCategoryFilter: string | null;
    handleAvailableCategoryChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    vaccinationFilter: boolean | null;
    handleVaccinationFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    microchipFilter: boolean | null;
    handleMicrochipFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    catsPerPage: number;
    handleCatsPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

const FilterSidebar = ({
                           clearAllFilters,
                           priceOrder,
                           handlePriceOrderChange,
                           genderFilter,
                           handleGenderFilterChange,
                           colorFilter,
                           handleColorFilterChange,
                           yearFilter,
                           handleYearFilterChange,
                           uniqueYears,
                           breedFilter,
                           handleBreedFilterChange,
                           uniqueBreeds,
                           categoryFilter,
                           handleCategoryFilterChange,
                           uniqueCategories,
                           availableCategoryFilter,
                           handleAvailableCategoryChange,
                           vaccinationFilter,
                           handleVaccinationFilterChange,
                           microchipFilter,
                           handleMicrochipFilterChange,
                           catsPerPage,
                           handleCatsPerPageChange,
                       }: FilterSidebarProps) => {
    return (
        <aside className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <button
                onClick={clearAllFilters}
                className="w-full mb-8 bg-red-500 text-white font-semibold py-3 px-4 rounded-lg shadow hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-300"
            >
                Clear All Filters
            </button>

            <FilterOption
                label="Filter by Availability"
                value={availableCategoryFilter}
                onChange={handleAvailableCategoryChange}
                options={[
                    { value: "", label: "All" },
                    { value: "Available", label: "Available" },
                    { value: "Reserved", label: "Reserved" },
                    { value: "Stays in cattery", label: "Stays in cattery" },
                ]}
            />

            <FilterOption
                label="Filter by Gender"
                value={genderFilter}
                onChange={handleGenderFilterChange}
                options={[
                    { value: "", label: "All" },
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" },
                ]}
            />

            <FilterOption
                label="Filter by Color"
                value={colorFilter}
                onChange={handleColorFilterChange}
                options={[
                    { value: "", label: "All" },
                    { value: "White", label: "White" },
                    { value: "Orange", label: "Orange" },
                    { value: "Gray", label: "Gray" },
                ]}
            />

            <FilterOption
                label="Filter by Year of Birth"
                value={yearFilter}
                onChange={handleYearFilterChange}
                options={[{ value: "", label: "All" }, ...uniqueYears.map((year) => ({
                    value: year,
                    label: String(year),
                }))]}
            />

            <FilterOption
                label="Filter by Breed"
                value={breedFilter}
                onChange={handleBreedFilterChange}
                options={[{ value: "", label: "All" }, ...uniqueBreeds.map((breed) => ({
                    value: breed,
                    label: breed,
                }))]}
            />

            <FilterOption
                label="Filter by Category"
                value={categoryFilter}
                onChange={handleCategoryFilterChange}
                options={[{ value: "", label: "All" }, ...uniqueCategories.map((cat) => ({
                    value: cat,
                    label: cat,
                }))]}
            />

            <FilterOption
                label="Filter by Vaccinated"
                value={vaccinationFilter === null ? "" : vaccinationFilter ? "Yes" : "No"}
                onChange={handleVaccinationFilterChange}
                options={[
                    { value: "", label: "All" },
                    { value: "Yes", label: "Yes" },
                    { value: "No", label: "No" },
                ]}
            />

            <FilterOption
                label="Filter by Microchipped"
                value={microchipFilter === null ? "" : microchipFilter ? "Yes" : "No"}
                onChange={handleMicrochipFilterChange}
                options={[
                    { value: "", label: "All" },
                    { value: "Yes", label: "Yes" },
                    { value: "No", label: "No" },
                ]}
            />

            <FilterOption
                label="Cats per Page"
                value={catsPerPage}
                onChange={handleCatsPerPageChange}
                options={[
                    { value: 9, label: "9" },
                    { value: 18, label: "18" },
                    { value: 32, label: "32" },
                ]}
            />
        </aside>
    );
};

export default FilterSidebar;
