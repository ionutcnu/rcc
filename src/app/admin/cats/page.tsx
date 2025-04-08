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
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useCatPopup } from "@/components/CatPopupProvider"
import { CatIcon } from "lucide-react"
import { getAllCats, deleteCat } from "@/lib/firebase/catService"
import type { CatProfile } from "@/lib/types/cat"

export default function AdminCatsPage() {
    const [viewMode, setViewMode] = useState<"list" | "grid">("grid")
    const { showPopup } = useCatPopup()
    const [cats, setCats] = useState<CatProfile[]>([])
    const [filteredCats, setFilteredCats] = useState<CatProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showFilters, setShowFilters] = useState(false)

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

    // Get unique breeds for filter dropdown
    const uniqueBreeds = Array.from(new Set(cats.map((cat) => cat.breed))).sort()

    // Get current year for age calculation
    const currentYear = new Date().getFullYear()

    useEffect(() => {
        const fetchCats = async () => {
            try {
                setLoading(true)
                const fetchedCats = await getAllCats()
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

        // Filter by breed
        if (breedFilter && breedFilter !== "all") {
            result = result.filter((cat) => cat.breed === breedFilter)
        }

        // Filter by availability
        if (availabilityFilter && availabilityFilter !== "all") {
            result = result.filter((cat) => cat.availability === availabilityFilter)
        }

        // Filter by gender
        if (genderFilter && genderFilter !== "all") {
            result = result.filter((cat) => cat.gender === genderFilter)
        }

        // Filter by age
        if (ageFilter && ageFilter !== "all") {
            const [minAge, maxAge] = ageFilter.split("-").map(Number)
            result = result.filter((cat) => {
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
    }, [cats, searchQuery, breedFilter, availabilityFilter, genderFilter, ageFilter, statusFilters])

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

    const handleDeleteCat = async (id: string | undefined) => {
        if (!id) {
            showPopup("Error: Cat ID is missing")
            return
        }

        try {
            await deleteCat(id)
            const updatedCats = cats.filter((cat) => cat.id !== id)
            setCats(updatedCats)
            setFilteredCats(updatedCats.filter((cat) => filteredCats.some((fc) => fc.id === cat.id)))
            showPopup("Cat deleted successfully")
        } catch (err) {
            console.error("Error deleting cat:", err)
            showPopup("Error deleting cat")
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
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Cat Profiles</h1>
                <Button asChild>
                    <Link href="/admin/cats/add">
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Cat
                    </Link>
                </Button>
            </div>

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

                            <div>
                                <Label htmlFor="availability-filter">Availability</Label>
                                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                                    <SelectTrigger id="availability-filter">
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="available">Available</SelectItem>
                                        <SelectItem value="reserved">Reserved</SelectItem>
                                        <SelectItem value="adopted">Adopted</SelectItem>
                                        <SelectItem value="not-available">Not Available</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="gender-filter">Gender</Label>
                                <Select value={genderFilter} onValueChange={setGenderFilter}>
                                    <SelectTrigger id="gender-filter">
                                        <SelectValue placeholder="All Genders" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Genders</SelectItem>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="age-filter">Age</Label>
                                <Select value={ageFilter} onValueChange={setAgeFilter}>
                                    <SelectTrigger id="age-filter">
                                        <SelectValue placeholder="All Ages" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Ages</SelectItem>
                                        <SelectItem value="0-1">Kitten (0-1 years)</SelectItem>
                                        <SelectItem value="1-7">Adult (1-7 years)</SelectItem>
                                        <SelectItem value="8-12">Senior (8-12 years)</SelectItem>
                                        <SelectItem value="13">Elderly (13+ years)</SelectItem>
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
                                        <h2 className="text-xl font-bold">{cat.name}</h2>
                                        <p className="text-gray-600 text-sm mt-1">
                                            {cat.breed}, {currentYear - cat.yearOfBirth} years old
                                        </p>
                                        <p className="text-gray-700 mt-2">{cat.description}</p>
                                        <div className="flex flex-wrap gap-2 mt-3">
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
                                            <Badge className="bg-orange-500 text-white">{cat.availability}</Badge>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/admin/cats/edit/${cat.id}`}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </Link>
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteCat(cat.id)}>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {paginatedCats.map((cat) => (
                        <Card key={cat.id} className="overflow-hidden h-full">
                            <div className="aspect-square relative">
                                <Image
                                    src={cat.mainImage || cat.images?.[0] || "/placeholder.svg?height=200&width=300"}
                                    alt={cat.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                />
                                <div className="absolute top-2 right-2">
                                    <Badge className="bg-orange-500 hover:bg-orange-600">{cat.availability}</Badge>
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h2 className="text-lg font-bold truncate">{cat.name}</h2>
                                    <span className="text-sm text-gray-500">{currentYear - cat.yearOfBirth}y</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-3 line-clamp-1">{cat.breed}</p>

                                <div className="flex flex-wrap gap-1 mb-3">
                                    {cat.isVaccinated && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-800"
                                        >
                                            Vaccinated
                                        </Badge>
                                    )}
                                    {cat.isMicrochipped && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-800"
                                        >
                                            Microchipped
                                        </Badge>
                                    )}
                                    {cat.isCastrated && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-200 hover:text-purple-800"
                                        >
                                            Castrated
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" className="h-8 px-2" asChild>
                                        <Link href={`/admin/cats/edit/${cat.id}`}>
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Link>
                                    </Button>
                                    <Button variant="destructive" size="sm" className="h-8 px-2" onClick={() => handleDeleteCat(cat.id)}>
                                        <Trash2 className="h-3.5 w-3.5" />
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
        </div>
    )
}
