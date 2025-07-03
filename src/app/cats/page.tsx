"use client"

import { useEffect, useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Footer from "@/components/layouts/Footer"
import Header from "@/components/layouts/Header"
import FilterSidebar from "@/components/elements/CatsRelated/FilterSidebar"
import CatGrid from "@/components/elements/CatsRelated/CatGrid"
import PaginationSection from "@/components/elements/CatsRelated/PaginationSection"
import { fetchAllCats } from "@/lib/client/catClient"
import type { CatProfile } from "@/lib/types/cat"
import { Filter, AlertCircle } from "lucide-react"

function CatsPageContent() {
    const searchParams = useSearchParams()
    const genderParam = searchParams.get("gender")
    const ageParam = searchParams.get("age")

    // State for cats data
    const [cats, setCats] = useState<CatProfile[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filter states
    const [genderFilter, setGenderFilter] = useState<string | null>(null)
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
    const [colorFilter, setColorFilter] = useState<string | null>(null)
    const [availableCategoryFilter, setAvailableCategoryFilter] = useState<string | null>(null)
    const [yearFilter, setYearFilter] = useState<number | null>(null)
    const [breedFilter, setBreedFilter] = useState<string | null>(null)
    const [vaccinationFilter, setVaccinationFilter] = useState<boolean | null>(null)
    const [microchipFilter, setMicrochipFilter] = useState<boolean | null>(null)
    const [priceOrder, setPriceOrder] = useState<string>("")

    // Pagination states
    const [catsPerPage, setCatsPerPage] = useState<number>(9)
    const [currentPage, setCurrentPage] = useState<number>(1)

    // Fetch cats from database
    useEffect(() => {
        const fetchCats = async () => {
            try {
                setIsLoading(true)
                console.log("Fetching cats for cats page...")
                const fetchedCats = await fetchAllCats(false) // false means don't include deleted cats
                console.log("Fetched cats for cats page:", fetchedCats)

                // Check if fetchedCats is valid
                if (!Array.isArray(fetchedCats)) {
                    console.error("fetchedCats is not an array:", fetchedCats)
                    setCats([])
                } else {
                    setCats(fetchedCats)
                }
            } catch (err) {
                console.error("Error fetching cats:", err)
                setError("Failed to load cats. Please try again later.")
                setCats([]) // Ensure cats is an empty array on error
            } finally {
                setIsLoading(false)
            }
        }

        fetchCats()
    }, [])

    // Apply URL parameters to filters
    useEffect(() => {
        if (genderParam) {
            // Capitalize first letter for consistency with database values
            setGenderFilter(genderParam.charAt(0).toUpperCase() + genderParam.slice(1))
        }

        if (ageParam === "kitten") {
            setCategoryFilter("Kitten")
        }
    }, [genderParam, ageParam])

    const clearAllFilters = () => {
        setGenderFilter(null)
        setCategoryFilter(null)
        setColorFilter(null)
        setYearFilter(null)
        setBreedFilter(null)
        setVaccinationFilter(null)
        setMicrochipFilter(null)
        setAvailableCategoryFilter(null)
        setPriceOrder("")
        setCurrentPage(1)
    }

    const filteredCats = useMemo(() => {
        const currentYear = new Date().getFullYear()

        const result = cats.filter((cat) => {
            // Gender filter
            if (genderFilter && cat.gender !== genderFilter) {
                return false
            }

            // Category filter (including special handling for "Kitten")
            if (categoryFilter === "Kitten") {
                // Check if cat is a kitten (not older than 1 year)
                const isKitten = cat.yearOfBirth ? currentYear - cat.yearOfBirth <= 1 : cat.age === 0 || cat.age === 1

                if (!isKitten) return false
            } else if (categoryFilter && cat.category !== categoryFilter) {
                return false
            }

            // Other filters
            if (colorFilter && cat.color !== colorFilter) return false
            if (yearFilter && cat.yearOfBirth !== yearFilter) return false
            if (breedFilter && cat.breed !== breedFilter) return false
            if (vaccinationFilter !== null && cat.isVaccinated !== vaccinationFilter) return false
            if (microchipFilter !== null && cat.isMicrochipped !== microchipFilter) return false
            if (availableCategoryFilter && cat.availability !== availableCategoryFilter) return false

            return true
        })

        return result
    }, [
        cats,
        genderFilter,
        categoryFilter,
        colorFilter,
        availableCategoryFilter,
        yearFilter,
        breedFilter,
        vaccinationFilter,
        microchipFilter,
        priceOrder,
    ])

    const totalPages = Math.ceil(filteredCats.length / catsPerPage)
    const displayedCats = filteredCats.slice((currentPage - 1) * catsPerPage, currentPage * catsPerPage)

    const redirectToProfile = (alias: string) => {
        window.location.href = `/cat-profile/${alias}`
    }

    // Extract unique values for filter options from database
    const uniqueYears = useMemo(
      () => Array.from(new Set(cats.map((cat) => cat.yearOfBirth).filter(Boolean))).sort((a, b) => b - a),
      [cats],
    )

    const uniqueBreeds = useMemo(() => Array.from(new Set(cats.map((cat) => cat.breed).filter(Boolean))), [cats])

    const uniqueCategories = useMemo(() => Array.from(new Set(cats.map((cat) => cat.category).filter(Boolean))), [cats])

    const uniqueColors = useMemo(() => Array.from(new Set(cats.map((cat) => cat.color).filter(Boolean))), [cats])

    const uniqueAvailabilities = useMemo(
      () => Array.from(new Set(cats.map((cat) => cat.availability).filter(Boolean))),
      [cats],
    )

    // Count active filters for the badge
    const activeFiltersCount = [
        genderFilter,
        colorFilter,
        yearFilter,
        breedFilter,
        categoryFilter,
        availableCategoryFilter,
        vaccinationFilter !== null,
        microchipFilter !== null,
        priceOrder !== "",
    ].filter(Boolean).length

    if (error) {
        return (
          <div className="bg-gray-100 min-h-screen">
              <Header />
              <div className="container mx-auto max-w-screen-xl py-6 px-4 md:px-0">
                  <div className="flex justify-center items-center h-64">
                      <div className="text-center bg-red-50 p-6 rounded-lg shadow-md max-w-md">
                          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
                          <p className="text-gray-600 mb-4">{error}</p>
                          <button
                            onClick={() => window.location.reload()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium"
                          >
                              Try Again
                          </button>
                      </div>
                  </div>
              </div>
              <Footer />
          </div>
        )
    }

    return (
      <div className="bg-gray-100 min-h-screen">
          <Header />

          <div className="container mx-auto max-w-screen-xl py-6 px-4 md:px-0">
              <div className="flex flex-col md:flex-row items-center justify-between mb-6">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 md:mb-0">Meet Our Cats</h1>

                  {/* Results count and active filters indicator (desktop) */}
                  <div className="hidden md:flex items-center space-x-4">
                      {!isLoading && (
                        <div className="text-gray-600">
                            <span className="font-medium">{filteredCats.length}</span> cats found
                        </div>
                      )}

                      {activeFiltersCount > 0 && (
                        <div className="flex items-center bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                            <Filter className="h-4 w-4 mr-1" />
                            <span className="text-sm font-medium">{activeFiltersCount} filters applied</span>
                        </div>
                      )}
                  </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/5">
                      <div className="sticky top-6">
                          <FilterSidebar
                            clearAllFilters={clearAllFilters}
                            priceOrder={priceOrder}
                            handlePriceOrderChange={(e) => setPriceOrder(e.target.value)}
                            genderFilter={genderFilter}
                            handleGenderFilterChange={(e) => setGenderFilter(e.target.value || null)}
                            colorFilter={colorFilter}
                            handleColorFilterChange={(e) => setColorFilter(e.target.value || null)}
                            yearFilter={yearFilter}
                            handleYearFilterChange={(e) => setYearFilter(e.target.value ? Number.parseInt(e.target.value) : null)}
                            uniqueYears={uniqueYears}
                            breedFilter={breedFilter}
                            handleBreedFilterChange={(e) => setBreedFilter(e.target.value || null)}
                            uniqueBreeds={uniqueBreeds}
                            categoryFilter={categoryFilter}
                            handleCategoryFilterChange={(e) => setCategoryFilter(e.target.value || null)}
                            uniqueCategories={uniqueCategories}
                            availableCategoryFilter={availableCategoryFilter}
                            handleAvailableCategoryChange={(e) => setAvailableCategoryFilter(e.target.value || null)}
                            uniqueAvailabilities={uniqueAvailabilities}
                            uniqueColors={uniqueColors}
                            vaccinationFilter={vaccinationFilter}
                            handleVaccinationFilterChange={(e) =>
                              setVaccinationFilter(e.target.value === "Yes" ? true : e.target.value === "No" ? false : null)
                            }
                            microchipFilter={microchipFilter}
                            handleMicrochipFilterChange={(e) =>
                              setMicrochipFilter(e.target.value === "Yes" ? true : e.target.value === "No" ? false : null)
                            }
                            isLoading={isLoading}
                            activeFiltersCount={activeFiltersCount}
                          />
                      </div>
                  </div>

                  <div className="w-full md:w-4/5">
                      {isLoading ? (
                        <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-md">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
                                <p className="text-lg text-gray-600">Loading cats...</p>
                            </div>
                        </div>
                      ) : filteredCats.length === 0 ? (
                        <div className="bg-yellow-50 p-8 rounded-lg shadow-md text-center">
                            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Cats Found</h2>
                            <p className="text-gray-600 mb-4">No cats match your current filter criteria.</p>
                            <button
                              onClick={clearAllFilters}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium"
                            >
                                Clear All Filters
                            </button>
                        </div>
                      ) : (
                        <>
                            {/* Mobile results count */}
                            <div className="md:hidden flex items-center justify-between mb-4 bg-white p-3 rounded-lg shadow-sm">
                                <div className="text-gray-600">
                                    <span className="font-medium">{filteredCats.length}</span> cats found
                                </div>

                                {activeFiltersCount > 0 && (
                                  <div className="flex items-center bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-xs">
                                      <Filter className="h-3 w-3 mr-1" />
                                      <span>{activeFiltersCount} filters</span>
                                  </div>
                                )}
                            </div>

                            {/* Pagination header - always visible */}
                            <div className="mb-3 bg-white p-2 rounded-md shadow-sm">
                                <PaginationSection
                                  currentPage={currentPage}
                                  totalPages={totalPages}
                                  catsPerPage={catsPerPage}
                                  filteredCatsLength={filteredCats.length}
                                  setCurrentPage={setCurrentPage}
                                  handleCatsPerPageChange={(e) => setCatsPerPage(Number.parseInt(e.target.value))}
                                />
                            </div>

                            <div className="bg-white rounded-md shadow-sm p-3 h-[calc(100vh-220px)] overflow-y-auto">
                                <CatGrid displayedCats={displayedCats} redirectToProfile={redirectToProfile} />
                            </div>
                        </>
                      )}
                  </div>
              </div>
          </div>

          <Footer />
      </div>
    )
}

export default function Page() {
    return (
      <Suspense fallback={<div className="text-center p-8">Loading cats...</div>}>
          <CatsPageContent />
      </Suspense>
    )
}
