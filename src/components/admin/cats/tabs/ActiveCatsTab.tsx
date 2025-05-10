"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
    Pencil,
    Trash2,
    LayoutGrid,
    List,
    Plus,
    Loader2,
    Search,
    Filter,
    X,
    ChevronLeft,
    ChevronRight,
    CatIcon,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useCatPopup } from "@/components/CatPopupProvider"
import { getAllCats } from "@/lib/firebase/catService"
import type { CatProfile } from "@/lib/types/cat"
import { SimpleConfirmDialog } from "@/components/simple-confirm-dialog"

export default function ActiveCatsTab() {
    const [viewMode, setViewMode] = useState<"list" | "grid">("grid")
    const { showPopup } = useCatPopup()
    const [cats, setCats] = useState<CatProfile[]>([])
    const [filteredCats, setFilteredCats] = useState<CatProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showFilters, setShowFilters] = useState(false)

    // Delete confirmation dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [catToDelete, setCatToDelete] = useState<{ id: string; name: string } | null>(null)

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState("")
    const [breedFilter, setBreedFilter] = useState<string>("")
    const [availabilityFilter, setAvailabilityFilter] = useState<string>("")
    const [ageFilter, setAgeFilter] = useState<string>("")
    const [genderFilter, setGenderFilter] = useState<string>("")
    const [statusFilters, setStatusFilters] = useState({
        isVaccinated: false,
        isMicrochipped: false,
        isCastrated: false,
    })

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(8)
    const [paginatedCats, setPaginatedCats] = useState<CatProfile[]>([])
    const [totalPages, setTotalPages] = useState(1)

    // Get current year for age calculation
    const currentYear = new Date().getFullYear()

    // Function to render gender badge
    const renderGenderBadge = (gender: string | undefined) => {
        if (!gender) return null

        const normalizedGender = gender.toLowerCase().trim()

        if (normalizedGender === "male") {
            return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300">♂ Male</Badge>
        } else if (normalizedGender === "female") {
            return <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-200 border-pink-300">♀ Female</Badge>
        } else {
            return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300">{gender}</Badge>
        }
    }

    useEffect(() => {
        const fetchCats = async () => {
            try {
                setLoading(true)
                // Explicitly pass false to exclude deleted cats
                const fetchedCats = await getAllCats(false)
                setCats(fetchedCats)
                setFilteredCats(fetchedCats)
            } catch (err) {
                console.error("Error fetching cats:", err)
                setError("Failed to load cats. Please try again later.")
                showPopup("Failed to load cats")
            } finally {
                setLoading(false)
            }
        }

        fetchCats()
    }, [showPopup])

    // Apply filters whenever filter criteria change
    useEffect(() => {
        let result = [...cats]

        // Filter by search query (name or description)
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
              (cat) =>
                cat.name.toLowerCase().includes(query) || (cat.description && cat.description.toLowerCase().includes(query)),
            )
        }

        // Filter by breed - with case-insensitive comparison
        if (breedFilter && breedFilter !== "all") {
            result = result.filter((cat) => {
                const catBreed = cat.breed?.toLowerCase().trim() || ""
                return catBreed === breedFilter.toLowerCase().trim()
            })
        }

        // Filter by availability - with case-insensitive comparison
        if (availabilityFilter && availabilityFilter !== "all") {
            result = result.filter((cat) => {
                const catAvailability = cat.availability?.toLowerCase().trim() || ""
                return catAvailability === availabilityFilter.toLowerCase().trim()
            })
        }

        // Filter by gender - with case-insensitive comparison
        if (genderFilter && genderFilter !== "all") {
            result = result.filter((cat) => {
                const catGender = cat.gender?.toLowerCase().trim() || ""
                return catGender === genderFilter.toLowerCase().trim()
            })
        }

        // Filter by age
        if (ageFilter && ageFilter !== "all") {
            const [minAge, maxAge] = ageFilter.split("-").map(Number)
            result = result.filter((cat) => {
                if (!cat.yearOfBirth) return false

                const age = currentYear - cat.yearOfBirth
                if (maxAge) {
                    return age >= minAge && age <= maxAge
                } else {
                    return age >= minAge
                }
            })
        }

        // Filter by status
        if (statusFilters.isVaccinated) {
            result = result.filter((cat) => cat.isVaccinated)
        }
        if (statusFilters.isMicrochipped) {
            result = result.filter((cat) => cat.isMicrochipped)
        }
        if (statusFilters.isCastrated) {
            result = result.filter((cat) => cat.isCastrated)
        }

        setFilteredCats(result)
        setCurrentPage(1) // Reset to first page when filters change
    }, [cats, searchQuery, breedFilter, availabilityFilter, genderFilter, ageFilter, statusFilters, currentYear])

    // Apply pagination
    useEffect(() => {
        const totalPages = Math.ceil(filteredCats.length / itemsPerPage)
        setTotalPages(totalPages || 1) // Ensure at least 1 page even if no results

        // Calculate the current page items
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const paginatedItems = filteredCats.slice(startIndex, endIndex)

        setPaginatedCats(paginatedItems)
    }, [filteredCats, currentPage, itemsPerPage])

    // Get unique values for filter dropdowns
    const uniqueBreeds = Array.from(new Set(cats.map((cat) => cat.breed?.trim())))
      .filter(Boolean)
      .sort()

    const uniqueAvailabilities = Array.from(new Set(cats.map((cat) => cat.availability?.trim())))
      .filter(Boolean)
      .sort()

    const uniqueGenders = Array.from(new Set(cats.map((cat) => cat.gender?.trim())))
      .filter(Boolean)
      .sort()

    // Generate age ranges based on actual cat ages
    const generateAgeRanges = () => {
        const ages = cats
          .filter((cat) => cat.yearOfBirth)
          .map((cat) => currentYear - cat.yearOfBirth)
          .sort((a, b) => a - b)

        if (ages.length === 0) return []

        // Create standard age ranges
        const ranges = [
            { label: "Kitten (0-1 years)", value: "0-1", min: 0, max: 1 },
            { label: "Adult (1-7 years)", value: "1-7", min: 1, max: 7 },
            { label: "Senior (8-12 years)", value: "8-12", min: 8, max: 12 },
            { label: "Elderly (13+ years)", value: "13", min: 13, max: 999 },
        ]

        // Filter ranges to only include those that have cats
        return ranges.filter((range) => {
            return ages.some((age) => age >= range.min && age <= range.max)
        })
    }

    const ageRanges = generateAgeRanges()

    // Function to handle delete button click
    const handleDeleteClick = (id: string, name: string) => {
        setCatToDelete({ id, name })
        setDeleteDialogOpen(true)
    }

    // Function to handle cancel delete
    const handleCancelDelete = () => {
        setDeleteDialogOpen(false)
        setCatToDelete(null)
    }

    // Function to confirm deletion
    const handleConfirmDelete = async () => {
        if (catToDelete) {
            try {
                // Call the API route to move the cat to trash
                const response = await fetch(`/api/cats/delete?id=${catToDelete.id}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    },
                })

                if (!response.ok) {
                    throw new Error("Failed to delete cat")
                }

                // Update local state
                const updatedCats = cats.filter((cat) => cat.id !== catToDelete.id)
                setCats(updatedCats)
                setFilteredCats(updatedCats.filter((cat) => filteredCats.some((fc) => fc.id === cat.id)))
                showPopup(`${catToDelete.name} moved to trash`)
            } catch (err) {
                console.error("Error deleting cat:", err)
                showPopup("Error moving cat to trash")
            } finally {
                setDeleteDialogOpen(false)
                setCatToDelete(null)
            }
        }
    }

    const resetFilters = () => {
        setSearchQuery("")
        setBreedFilter("")
        setAvailabilityFilter("")
        setAgeFilter("")
        setGenderFilter("")
        setStatusFilters({
            isVaccinated: false,
            isMicrochipped: false,
            isCastrated: false,
        })
    }

    const goToPage = (page: number) => {
        if (page < 1) page = 1
        if (page > totalPages) page = totalPages
        setCurrentPage(page)
    }

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pageNumbers = []
        const maxPagesToShow = 5 // Show at most 5 page numbers

        if (totalPages <= maxPagesToShow) {
            // If we have 5 or fewer pages, show all of them
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i)
            }
        } else {
            // Always include first page
            pageNumbers.push(1)

            // Calculate start and end of the middle section
            let startPage = Math.max(2, currentPage - 1)
            let endPage = Math.min(totalPages - 1, currentPage + 1)

            // Adjust if we're near the beginning
            if (currentPage <= 3) {
                endPage = 4
            }

            // Adjust if we're near the end
            if (currentPage >= totalPages - 2) {
                startPage = totalPages - 3
            }

            // Add ellipsis after first page if needed
            if (startPage > 2) {
                pageNumbers.push("...")
            }

            // Add middle pages
            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(i)
            }

            // Add ellipsis before last page if needed
            if (endPage < totalPages - 1) {
                pageNumbers.push("...")
            }

            // Always include last page
            pageNumbers.push(totalPages)
        }

        return pageNumbers
    }

    if (loading) {
        return (
          <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <span className="ml-2">Loading cats...</span>
          </div>
        )
    }

    if (error) {
        return (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
              <h2 className="text-lg font-semibold text-red-700">Error</h2>
              <p className="text-red-600">{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                  Try Again
              </Button>
          </div>
        )
    }

    return (
      <div className="space-y-6">
          {/* Search and View Toggle */}
          <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search cats by name or description..."
                    className="pl-10 pr-4"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
              <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className={showFilters ? "bg-gray-100" : ""}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                      <Filter className="h-4 w-4" />
                  </Button>
                  <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("list")}>
                      <List className="mr-2 h-4 w-4" />
                      List
                  </Button>
                  <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("grid")}>
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      Grid
                  </Button>
              </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card>
                <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">Filters</h3>
                        <Button variant="ghost" size="sm" onClick={resetFilters}>
                            <X className="mr-2 h-4 w-4" />
                            Reset Filters
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Breed Filter - Dynamic Options */}
                        <div>
                            <Label htmlFor="breed-filter">Breed</Label>
                            <Select value={breedFilter} onValueChange={setBreedFilter}>
                                <SelectTrigger id="breed-filter">
                                    <SelectValue placeholder="All Breeds" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Breeds</SelectItem>
                                    {uniqueBreeds.map((breed) => (
                                      <SelectItem key={breed} value={breed}>
                                          {breed}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Availability Filter - Dynamic Options */}
                        <div>
                            <Label htmlFor="availability-filter">Availability</Label>
                            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                                <SelectTrigger id="availability-filter">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    {uniqueAvailabilities.map((availability) => (
                                      <SelectItem key={availability} value={availability}>
                                          {availability}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Gender Filter - Dynamic Options */}
                        <div>
                            <Label htmlFor="gender-filter">Gender</Label>
                            <Select value={genderFilter} onValueChange={setGenderFilter}>
                                <SelectTrigger id="gender-filter">
                                    <SelectValue placeholder="All Genders" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Genders</SelectItem>
                                    {uniqueGenders.map((gender) => (
                                      <SelectItem key={gender} value={gender}>
                                          {gender}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Age Filter - Dynamic Options based on actual age ranges */}
                        <div>
                            <Label htmlFor="age-filter">Age</Label>
                            <Select value={ageFilter} onValueChange={setAgeFilter}>
                                <SelectTrigger id="age-filter">
                                    <SelectValue placeholder="All Ages" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Ages</SelectItem>
                                    {ageRanges.map((range) => (
                                      <SelectItem key={range.value} value={range.value}>
                                          {range.label}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="items-per-page">Items Per Page</Label>
                            <Select
                              value={itemsPerPage.toString()}
                              onValueChange={(value) => {
                                  setItemsPerPage(Number(value))
                                  setCurrentPage(1) // Reset to first page when changing items per page
                              }}
                            >
                                <SelectTrigger id="items-per-page">
                                    <SelectValue placeholder="8" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="8">8</SelectItem>
                                    <SelectItem value="12">12</SelectItem>
                                    <SelectItem value="16">16</SelectItem>
                                    <SelectItem value="24">24</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="md:col-span-2">
                            <Label className="mb-2 block">Status</Label>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="vaccinated"
                                      checked={statusFilters.isVaccinated}
                                      onCheckedChange={(checked) =>
                                        setStatusFilters({ ...statusFilters, isVaccinated: checked === true })
                                      }
                                    />
                                    <Label htmlFor="vaccinated" className="text-sm">
                                        Vaccinated
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="microchipped"
                                      checked={statusFilters.isMicrochipped}
                                      onCheckedChange={(checked) =>
                                        setStatusFilters({ ...statusFilters, isMicrochipped: checked === true })
                                      }
                                    />
                                    <Label htmlFor="microchipped" className="text-sm">
                                        Microchipped
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="castrated"
                                      checked={statusFilters.isCastrated}
                                      onCheckedChange={(checked) =>
                                        setStatusFilters({ ...statusFilters, isCastrated: checked === true })
                                      }
                                    />
                                    <Label htmlFor="castrated" className="text-sm">
                                        Castrated
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
          )}

          {/* Results count */}
          <div className="text-sm text-gray-500">
              Showing {paginatedCats.length} of {filteredCats.length} cats
              {filteredCats.length !== cats.length && ` (filtered from ${cats.length} total)`}
          </div>

          {viewMode === "list" ? (
            <div className="space-y-4">
                {paginatedCats.map((cat) => (
                  <Card key={cat.id}>
                      <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                              <div>
                                  <div className="flex items-center gap-2 mb-1">
                                      <h2 className="text-xl font-bold">{cat.name}</h2>
                                      {renderGenderBadge(cat.gender)}
                                  </div>
                                  <p className="text-gray-600 text-sm mt-1">
                                      {cat.breed}, {currentYear - cat.yearOfBirth} years old
                                  </p>
                                  <p className="text-gray-700 mt-2">{cat.description}</p>
                                  <div className="flex flex-wrap gap-2 mt-3">
                                      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">{cat.availability}</Badge>
                                      {cat.isVaccinated && (
                                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                                            Vaccinated
                                        </Badge>
                                      )}
                                      {cat.isMicrochipped && (
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                            Microchipped
                                        </Badge>
                                      )}
                                      {cat.isCastrated && (
                                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                            Castrated
                                        </Badge>
                                      )}
                                  </div>
                              </div>
                              <div className="flex space-x-2">
                                  <Button variant="outline" size="sm" asChild>
                                      <Link href={`/admin/cats/edit/${cat.id}`}>
                                          <Pencil className="mr-2 h-4 w-4" />
                                          Edit
                                      </Link>
                                  </Button>
                                  <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(cat.id, cat.name)}>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                  </Button>
                              </div>
                          </div>
                      </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {paginatedCats.map((cat) => (
                  <Card key={cat.id} className="overflow-hidden h-full">
                      <div className="aspect-[4/3] relative">
                          <Image
                            src={cat.mainImage || cat.images?.[0] || "/placeholder.svg?height=200&width=300"}
                            alt={cat.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          />
                      </div>
                      <CardContent className="p-2">
                          <div className="flex justify-between items-start mb-1">
                              <h2 className="text-sm font-bold truncate">{cat.name}</h2>
                              <span className="text-xs text-gray-500">{currentYear - cat.yearOfBirth}y</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                              {renderGenderBadge(cat.gender)}
                              <p className="text-sm text-gray-600 line-clamp-1">{cat.breed}</p>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-3">
                              <Badge className="text-xs px-1 py-0 h-5 bg-orange-100 text-orange-800 hover:bg-orange-200 hover:text-orange-800">
                                  {cat.availability}
                              </Badge>
                              {cat.isVaccinated && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs px-1 py-0 h-5 bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-800"
                                >
                                    Vaccinated
                                </Badge>
                              )}
                              {cat.isMicrochipped && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs px-1 py-0 h-5 bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-800"
                                >
                                    Microchipped
                                </Badge>
                              )}
                              {cat.isCastrated && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs px-1 py-0 h-5 bg-purple-100 text-purple-800 hover:bg-purple-200 hover:text-purple-800"
                                >
                                    Castrated
                                </Badge>
                              )}
                          </div>

                          <div className="flex justify-end gap-1 mt-1">
                              <Button variant="outline" size="sm" className="h-6 px-1 text-xs" asChild>
                                  <Link href={`/admin/cats/edit/${cat.id}`}>
                                      <Pencil className="h-3 w-3" />
                                  </Link>
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-6 px-1 text-xs"
                                onClick={() => handleDeleteClick(cat.id, cat.name)}
                              >
                                  <Trash2 className="h-3 w-3" />
                              </Button>
                          </div>
                      </CardContent>
                  </Card>
                ))}
            </div>
          )}

          {filteredCats.length === 0 && !loading && (
            <Card className="py-12">
                <CardContent className="flex flex-col items-center justify-center text-center">
                    <div className="rounded-full bg-muted p-6 mb-4">
                        <CatIcon className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">No cats found</h3>
                    <p className="text-muted-foreground mb-4">
                        {cats.length > 0 ? "Try adjusting your filters or search query" : "Add your first cat to get started"}
                    </p>
                    {cats.length > 0 ? (
                      <Button variant="outline" onClick={resetFilters}>
                          Reset Filters
                      </Button>
                    ) : (
                      <Button asChild>
                          <Link href="/admin/cats/add">
                              <Plus className="mr-2 h-4 w-4" />
                              Add New Cat
                          </Link>
                      </Button>
                    )}
                </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {filteredCats.length > 0 && (
            <div className="flex items-center justify-between border-t pt-4">
                <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Previous Page</span>
                    </Button>

                    <div className="flex items-center">
                        {getPageNumbers().map((page, index) =>
                            typeof page === "number" ? (
                              <Button
                                key={index}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                className="w-8 h-8 p-0 mx-1"
                                onClick={() => goToPage(page)}
                              >
                                  {page}
                              </Button>
                            ) : (
                              <span key={index} className="mx-1">
                    ...
                  </span>
                            ),
                        )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next Page</span>
                    </Button>
                </div>
            </div>
          )}

          {/* Simple Delete Confirmation Dialog */}
          <SimpleConfirmDialog
            isOpen={deleteDialogOpen}
            title="Delete Cat"
            message={`Are you sure you want to delete ${catToDelete?.name || "this cat"}? This action cannot be undone.`}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
          />
      </div>
    )
}
