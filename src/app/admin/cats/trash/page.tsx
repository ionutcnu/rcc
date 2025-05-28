"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Loader2, ArchiveRestore, Trash2, Search, Filter, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/useToast"
import { fetchTrashCats } from "@/lib/api/catClient"
import type { CatProfile } from "@/lib/types/cat"
import { SimpleConfirmDialog } from "@/components/simple-confirm-dialog"

export default function TrashCatsPage() {
    const [cats, setCats] = useState<CatProfile[]>([])
    const [filteredCats, setFilteredCats] = useState<CatProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()

    // Filter states
    const [searchQuery, setSearchQuery] = useState("")
    const [breedFilter, setBreedFilter] = useState<string>("")
    const [genderFilter, setGenderFilter] = useState<string>("")
    const [showFilters, setShowFilters] = useState(false)

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(8)
    const [totalPages, setTotalPages] = useState(1)

    // Delete confirmation dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [catToDelete, setCatToDelete] = useState<CatProfile | null>(null)

    // Restore confirmation dialog state
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
    const [catToRestore, setCatToRestore] = useState<CatProfile | null>(null)

    // Get current year for age calculation
    const currentYear = new Date().getFullYear()

    // Fetch deleted cats on component mount
    useEffect(() => {
        const fetchDeletedCats = async () => {
            try {
                setLoading(true)
                const fetchedCats = await fetchTrashCats()
                setCats(fetchedCats)
                setFilteredCats(fetchedCats)
                setTotalPages(Math.ceil(fetchedCats.length / itemsPerPage))
            } catch (err) {
                console.error("Error fetching deleted cats:", err)
                setError("Failed to load deleted cats. Please try again later.")
                toast.error("Failed to load deleted cats")
            } finally {
                setLoading(false)
            }
        }

        fetchDeletedCats()
    }, [toast, itemsPerPage])

    // Apply filters when filter criteria change
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
        if (breedFilter) {
            result = result.filter((cat) => {
                const catBreed = cat.breed?.toLowerCase().trim() || ""
                return catBreed === breedFilter.toLowerCase().trim()
            })
        }

        // Filter by gender
        if (genderFilter) {
            result = result.filter((cat) => {
                const catGender = cat.gender?.toLowerCase().trim() || ""
                return catGender === genderFilter.toLowerCase().trim()
            })
        }

        setFilteredCats(result)
        setTotalPages(Math.ceil(result.length / itemsPerPage))
        setCurrentPage(1) // Reset to first page when filters change
    }, [cats, searchQuery, breedFilter, genderFilter, itemsPerPage])

    // Get unique values for filter dropdowns
    const uniqueBreeds = Array.from(new Set(cats.map((cat) => cat.breed?.trim())))
      .filter(Boolean)
      .sort()

    const uniqueGenders = Array.from(new Set(cats.map((cat) => cat.gender?.trim())))
      .filter(Boolean)
      .sort()

    // Function to handle restore button click
    const handleRestoreClick = (cat: CatProfile) => {
        setCatToRestore(cat)
        setRestoreDialogOpen(true)
    }

    // Function to handle delete button click
    const handleDeleteClick = (cat: CatProfile) => {
        setCatToDelete(cat)
        setDeleteDialogOpen(true)
    }

    // Function to confirm restoration
    const handleRestoreConfirm = async () => {
        if (!catToRestore) return

        try {
            const response = await fetch("/api/cats/restore", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id: catToRestore.id }),
            })

            if (!response.ok) {
                throw new Error(`Error restoring cat: ${response.status}`)
            }

            setCats(cats.filter((cat) => cat.id !== catToRestore.id))
            setFilteredCats(filteredCats.filter((cat) => cat.id !== catToRestore.id))
            toast.success(`${catToRestore.name} restored successfully`)
        } catch (err) {
            console.error("Error restoring cat:", err)
            toast.error("Error restoring cat")
        } finally {
            setRestoreDialogOpen(false)
            setCatToRestore(null)
        }
    }

    // Function to confirm permanent deletion
    const handleDeleteConfirm = async () => {
        if (!catToDelete) return

        try {
            const response = await fetch(`/api/cats/delete?id=${catToDelete.id}&permanent=true`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            })

            if (!response.ok) {
                throw new Error(`Error deleting cat: ${response.status}`)
            }

            setCats(cats.filter((cat) => cat.id !== catToDelete.id))
            setFilteredCats(filteredCats.filter((cat) => cat.id !== catToDelete.id))
            toast.success(`${catToDelete.name} permanently deleted`)
        } catch (err) {
            console.error("Error deleting cat:", err)
            toast.error("Error deleting cat")
        } finally {
            setDeleteDialogOpen(false)
            setCatToDelete(null)
        }
    }

    const resetFilters = () => {
        setSearchQuery("")
        setBreedFilter("")
        setGenderFilter("")
    }

    // Get paginated cats
    const paginatedCats = filteredCats.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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
              <span className="ml-2">Loading deleted cats...</span>
          </div>
        )
    }

    return (
      <div className="space-y-6">
          <div className="flex justify-between items-center">
              <div>
                  <h1 className="text-3xl font-bold">Cat Trash</h1>
                  <p className="text-gray-500">Cats that have been deleted but can be restored</p>
              </div>
              <Button variant="outline" asChild>
                  <Link href="/admin/cats">
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back to Cats
                  </Link>
              </Button>
          </div>

          <Card>
              <CardHeader>
                  <CardTitle>Deleted Cats</CardTitle>
                  <CardDescription>
                      Cats in trash can be restored or permanently deleted. Permanent deletion will also remove all associated
                      media files.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                      <div className="relative flex-grow">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="Search deleted cats..."
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
                      </div>
                  </div>

                  {/* Filters Panel */}
                  {showFilters && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-medium">Filters</h3>
                            <Button variant="ghost" size="sm" onClick={resetFilters}>
                                <X className="mr-2 h-4 w-4" />
                                Reset Filters
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Breed Filter */}
                            <div>
                                <label htmlFor="breed-filter" className="block text-sm font-medium mb-1">
                                    Breed
                                </label>
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

                            {/* Gender Filter */}
                            <div>
                                <label htmlFor="gender-filter" className="block text-sm font-medium mb-1">
                                    Gender
                                </label>
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

                            {/* Items Per Page */}
                            <div>
                                <label htmlFor="items-per-page" className="block text-sm font-medium mb-1">
                                    Items Per Page
                                </label>
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
                        </div>
                    </div>
                  )}

                  {/* Results count */}
                  <div className="text-sm text-gray-500 mb-4">
                      Showing {paginatedCats.length} of {filteredCats.length} deleted cats
                      {filteredCats.length !== cats.length && ` (filtered from ${cats.length} total)`}
                  </div>

                  {filteredCats.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Trash2 className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900">No deleted cats</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {cats.length > 0
                              ? "No cats match your current filters. Try adjusting your search or filter criteria."
                              : "The trash is empty. Deleted cats will appear here."}
                        </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {paginatedCats.map((cat) => (
                          <Card key={cat.id} className="overflow-hidden border-dashed">
                              <div className="aspect-square relative">
                                  <Image
                                    src={cat.mainImage || cat.images?.[0] || "/placeholder.svg?height=200&width=300"}
                                    alt={cat.name}
                                    fill
                                    className="object-cover opacity-70"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                  />
                                  <div className="absolute top-2 right-2">
                                      <Badge variant="destructive">Deleted</Badge>
                                  </div>
                              </div>
                              <CardContent className="p-4">
                                  <div className="flex justify-between items-start mb-2">
                                      <h2 className="text-lg font-bold truncate">{cat.name}</h2>
                                      <span className="text-sm text-gray-500">{currentYear - cat.yearOfBirth}y</span>
                                  </div>
                                  <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="outline">{cat.gender}</Badge>
                                      <p className="text-sm text-gray-600 line-clamp-1">{cat.breed}</p>
                                  </div>

                                  <div className="flex justify-between gap-2 mt-4">
                                      <Button variant="outline" size="sm" onClick={() => handleRestoreClick(cat)}>
                                          <ArchiveRestore className="mr-2 h-4 w-4" />
                                          Restore
                                      </Button>
                                      <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(cat)}>
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                      </Button>
                                  </div>
                              </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {filteredCats.length > 0 && (
                    <div className="flex items-center justify-between border-t pt-4 mt-6">
                        <div className="text-sm text-gray-500">
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
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
                                        onClick={() => setCurrentPage(page)}
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
                              onClick={() => setCurrentPage(currentPage + 1)}
                              disabled={currentPage === totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                                <span className="sr-only">Next Page</span>
                            </Button>
                        </div>
                    </div>
                  )}
              </CardContent>
          </Card>

          {/* Restore Confirmation Dialog */}
          <SimpleConfirmDialog
            isOpen={restoreDialogOpen}
            title="Restore Cat"
            message={`Are you sure you want to restore ${catToRestore?.name || "this cat"}?`}
            onConfirm={handleRestoreConfirm}
            onCancel={() => {
                setRestoreDialogOpen(false)
                setCatToRestore(null)
            }}
            confirmText="Restore"
          />

          {/* Delete Confirmation Dialog */}
          <SimpleConfirmDialog
            isOpen={deleteDialogOpen}
            title="Delete Cat Permanently"
            message={`Are you sure you want to permanently delete ${catToDelete?.name || "this cat"}? This action cannot be undone and will delete all associated media files.`}
            onConfirm={handleDeleteConfirm}
            onCancel={() => {
                setDeleteDialogOpen(false)
                setCatToDelete(null)
            }}
            confirmText="Delete Permanently"
            confirmVariant="destructive"
          />
      </div>
    )
}
