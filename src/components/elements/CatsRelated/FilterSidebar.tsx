"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Filter } from "lucide-react"
import { GiCat, GiPawPrint } from "react-icons/gi"
import type React from "react"

type FilterOptionProps = {
    label: string
    value: string | number | null
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    options: { value: string | number | null; label: string }[]
    disabled?: boolean
}

const FilterOption = ({ label, value, onChange, options, disabled = false }: FilterOptionProps) => (
    <div className="mb-6">
        <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
            <GiPawPrint className="w-3 h-3 mr-2 text-red-500" />
            {label}
        </label>
        <select
            value={value ?? ""}
            onChange={onChange}
            disabled={disabled}
            className={`cat-input w-full text-sm ${
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
        <aside className="cat-card cat-hover-lift relative">
            {/* Floating Cat Decoration */}
            <div className="absolute top-2 right-2 opacity-20">
                <GiCat className="w-8 h-8 text-red-300 animate-purr" />
            </div>
            
            {/* Mobile filter toggle */}
            <div className="md:hidden p-4 flex items-center justify-between">
                <div className="flex items-center">
                    <div className="animate-cat-bounce mr-3">
                        <GiCat className="h-5 w-5 text-red-500" />
                    </div>
                    <h2 className="text-lg font-bold cat-text-gradient-warm">Filters</h2>
                    {activeFiltersCount > 0 && (
                        <span className="ml-3 bg-gradient-to-r from-red-100 to-pink-100 text-red-700 text-xs px-3 py-1 rounded-full font-semibold">
                            {activeFiltersCount}
                        </span>
                    )}
                </div>
                <button
                    onClick={toggleFilters}
                    className="cat-button-outline !px-3 !py-2 flex items-center"
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? "Collapse filters" : "Expand filters"}
                >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {/* Desktop header */}
            <div className="hidden md:flex items-center justify-between p-6 border-b border-red-100">
                <div className="flex items-center">
                    <div className="animate-cat-bounce mr-3">
                        <GiCat className="h-6 w-6 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold cat-text-gradient-warm">Filters</h2>
                </div>
                <div className="flex items-center gap-3">
                    {isLoading && (
                        <div className="animate-cat-bounce">
                            <GiPawPrint className="h-4 w-4 text-red-500" />
                        </div>
                    )}
                    <button
                        onClick={clearAllFilters}
                        disabled={isLoading}
                        className={`cat-button-outline !px-4 !py-1 !text-xs ${
                            isLoading ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                    >
                        Clear all
                    </button>
                </div>
            </div>

            {/* Filter content - collapsible on mobile */}
            <div
                className={`${
                    isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 md:max-h-[2000px] md:opacity-100"
                } overflow-hidden transition-all duration-500 ease-in-out`}
            >
                <div className="p-6">
                    {/* Mobile clear all button */}
                    <div className="md:hidden flex justify-end mb-4">
                        <button
                            onClick={() => {
                                clearAllFilters()
                            }}
                            disabled={isLoading}
                            className={`cat-button-outline !px-4 !py-1 !text-xs ${
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
                    <div className="md:hidden mt-6">
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="w-full cat-button-primary flex items-center justify-center !py-3"
                        >
                            <GiPawPrint className="mr-2 w-4 h-4 animate-paw-wave" />
                            Apply Filters
                            <GiCat className="ml-2 w-4 h-4 animate-cat-bounce" />
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    )
}

export default FilterSidebar
