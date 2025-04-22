"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Filter } from "lucide-react"
import type React from "react"

type FilterOptionProps = {
    label: string
    value: string | number | null
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    options: { value: string | number | null; label: string }[]
    disabled?: boolean
}

// Update the FilterOption component to make it more compact
const FilterOption = ({ label, value, onChange, options, disabled = false }: FilterOptionProps) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-800 mb-1">{label}</label>
        <select
            value={value ?? ""}
            onChange={onChange}
            disabled={disabled}
            className={`w-full border border-gray-300 rounded-md py-1.5 px-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 hover:border-indigo-400 transition-all duration-300 shadow-sm ${
                disabled ? "opacity-60 cursor-not-allowed" : ""
            }`}
        >
            {options.map((opt) => (
                <option key={`${opt.value ?? "null"}-${opt.label}`} value={opt.value ?? ""}>
                    {opt.label}
                </option>
            ))}
        </select>
    </div>
)

type FilterSidebarProps = {
    clearAllFilters: () => void
    priceOrder: string
    handlePriceOrderChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    genderFilter: string | null
    handleGenderFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    colorFilter: string | null
    handleColorFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    yearFilter: number | null
    handleYearFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    uniqueYears: number[]
    breedFilter: string | null
    handleBreedFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    uniqueBreeds: string[]
    categoryFilter: string | null
    handleCategoryFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    uniqueCategories: string[]
    availableCategoryFilter: string | null
    handleAvailableCategoryChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    uniqueAvailabilities: string[]
    uniqueColors: string[]
    vaccinationFilter: boolean | null
    handleVaccinationFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    microchipFilter: boolean | null
    handleMicrochipFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    isLoading?: boolean
    activeFiltersCount?: number
}

// Update the FilterSidebar component to be more compact and collapsible on mobile
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
                           uniqueAvailabilities,
                           uniqueColors,
                           vaccinationFilter,
                           handleVaccinationFilterChange,
                           microchipFilter,
                           handleMicrochipFilterChange,
                           isLoading = false,
                           activeFiltersCount = 0,
                       }: FilterSidebarProps) => {
    const [isExpanded, setIsExpanded] = useState(false)

    const toggleFilters = () => {
        setIsExpanded(!isExpanded)
    }

    return (
        <aside className="bg-white rounded-lg shadow-md border border-gray-200">
            {/* Mobile filter toggle */}
            <div className="md:hidden p-3 flex items-center justify-between">
                <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2 text-indigo-600" />
                    <h2 className="text-base font-semibold text-gray-800">Filters</h2>
                    {activeFiltersCount > 0 && (
                        <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
                    )}
                </div>
                <button
                    onClick={toggleFilters}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? "Collapse filters" : "Expand filters"}
                >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
            </div>

            {/* Desktop header */}
            <div className="hidden md:flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-800">Filters</h2>
                {isLoading && (
                    <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                )}
                <button
                    onClick={clearAllFilters}
                    disabled={isLoading}
                    className={`text-xs text-gray-500 hover:text-gray-700 underline focus:outline-none transition-colors ${
                        isLoading ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                >
                    Clear all
                </button>
            </div>

            {/* Filter content - collapsible on mobile */}
            <div
                className={`${
                    isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 md:max-h-[2000px] md:opacity-100"
                } overflow-hidden transition-all duration-300 ease-in-out`}
            >
                <div className="p-4">
                    {/* Mobile clear all button */}
                    <div className="md:hidden flex justify-end mb-3">
                        <button
                            onClick={() => {
                                clearAllFilters()
                                // Optionally collapse after clearing
                                // setIsExpanded(false)
                            }}
                            disabled={isLoading}
                            className={`text-xs text-gray-500 hover:text-gray-700 underline focus:outline-none transition-colors ${
                                isLoading ? "opacity-60 cursor-not-allowed" : ""
                            }`}
                        >
                            Clear all
                        </button>
                    </div>

                    {uniqueAvailabilities.length > 0 && (
                        <FilterOption
                            label="Availability"
                            value={availableCategoryFilter}
                            onChange={(e) => {
                                handleAvailableCategoryChange(e)
                                // Optionally collapse after selecting
                                // setIsExpanded(false)
                            }}
                            options={[
                                { value: "", label: "All" },
                                ...uniqueAvailabilities.map((availability) => ({
                                    value: availability,
                                    label: availability,
                                })),
                            ]}
                            disabled={isLoading}
                        />
                    )}

                    <FilterOption
                        label="Gender"
                        value={genderFilter}
                        onChange={(e) => {
                            handleGenderFilterChange(e)
                            // Optionally collapse after selecting
                            // setIsExpanded(false)
                        }}
                        options={[
                            { value: "", label: "All" },
                            { value: "Male", label: "Male" },
                            { value: "Female", label: "Female" },
                        ]}
                        disabled={isLoading}
                    />

                    {uniqueColors.length > 0 && (
                        <FilterOption
                            label="Color"
                            value={colorFilter}
                            onChange={(e) => {
                                handleColorFilterChange(e)
                                // Optionally collapse after selecting
                                // setIsExpanded(false)
                            }}
                            options={[
                                { value: "", label: "All" },
                                ...uniqueColors.map((color) => ({
                                    value: color,
                                    label: color,
                                })),
                            ]}
                            disabled={isLoading}
                        />
                    )}

                    {uniqueYears.length > 0 && (
                        <FilterOption
                            label="Year of Birth"
                            value={yearFilter}
                            onChange={(e) => {
                                handleYearFilterChange(e)
                                // Optionally collapse after selecting
                                // setIsExpanded(false)
                            }}
                            options={[
                                { value: "", label: "All" },
                                ...uniqueYears.map((year) => ({
                                    value: year,
                                    label: String(year),
                                })),
                            ]}
                            disabled={isLoading}
                        />
                    )}

                    {uniqueBreeds.length > 0 && (
                        <FilterOption
                            label="Breed"
                            value={breedFilter}
                            onChange={(e) => {
                                handleBreedFilterChange(e)
                                // Optionally collapse after selecting
                                // setIsExpanded(false)
                            }}
                            options={[
                                { value: "", label: "All" },
                                ...uniqueBreeds.map((breed) => ({
                                    value: breed,
                                    label: breed,
                                })),
                            ]}
                            disabled={isLoading}
                        />
                    )}

                    <FilterOption
                        label="Category"
                        value={categoryFilter}
                        onChange={(e) => {
                            handleCategoryFilterChange(e)
                            // Optionally collapse after selecting
                            // setIsExpanded(false)
                        }}
                        options={[
                            { value: "", label: "All" },
                            { value: "Kitten", label: "Kitten" }, // Keep this special option
                            ...uniqueCategories
                                .filter((cat) => cat !== "Kitten") // Avoid duplicate "Kitten" option
                                .map((cat) => ({
                                    value: cat,
                                    label: cat,
                                })),
                        ]}
                        disabled={isLoading || (uniqueCategories.length === 0 && categoryFilter !== "Kitten")}
                    />

                    <FilterOption
                        label="Vaccinated"
                        value={vaccinationFilter === null ? "" : vaccinationFilter ? "Yes" : "No"}
                        onChange={(e) => {
                            handleVaccinationFilterChange(e)
                            // Optionally collapse after selecting
                            // setIsExpanded(false)
                        }}
                        options={[
                            { value: "", label: "All" },
                            { value: "Yes", label: "Yes" },
                            { value: "No", label: "No" },
                        ]}
                        disabled={isLoading}
                    />

                    <FilterOption
                        label="Microchipped"
                        value={microchipFilter === null ? "" : microchipFilter ? "Yes" : "No"}
                        onChange={(e) => {
                            handleMicrochipFilterChange(e)
                            // Optionally collapse after selecting
                            // setIsExpanded(false)
                        }}
                        options={[
                            { value: "", label: "All" },
                            { value: "Yes", label: "Yes" },
                            { value: "No", label: "No" },
                        ]}
                        disabled={isLoading}
                    />


                    {/* Mobile apply button */}
                    <div className="md:hidden mt-4">
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    )
}

export default FilterSidebar
