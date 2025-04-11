"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
    totalItems: number
    itemsPerPage: number
    currentPage: number
    onPageChange: (page: number) => void
}

export function Pagination({ totalItems, itemsPerPage, currentPage, onPageChange }: PaginationProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage)

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

    const goToPage = (page: number) => {
        if (page < 1) page = 1
        if (page > totalPages) page = totalPages
        onPageChange(page)
    }

    return (
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
    )
}

// These are the individual components that can be used to build custom pagination
// They're kept separate from the main Pagination component for flexibility

const PaginationContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("flex w-full items-center justify-center", className)} {...props} />
    ),
)
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => <div ref={ref} className={cn("", className)} {...props} />,
)
PaginationItem.displayName = "PaginationItem"

const PaginationLink = ({
                            className,
                            isActive = false,
                            size = "icon",
                            ...props
                        }: React.ComponentProps<typeof Button> & {
    isActive?: boolean
}) => (
    <Button
        aria-current={isActive ? "page" : undefined}
        variant={isActive ? "outline" : "ghost"}
        size={size}
        className={cn("h-8 w-8 p-0", className)}
        {...props}
    />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({ className, ...props }: React.ComponentProps<typeof Button>) => (
    <Button variant="outline" size="sm" className={cn("gap-1 pl-2.5", className)} {...props}>
        <ChevronLeft className="h-4 w-4" />
        <span>Previous</span>
    </Button>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({ className, ...props }: React.ComponentProps<typeof Button>) => (
    <Button variant="outline" size="sm" className={cn("gap-1 pr-2.5", className)} {...props}>
        <span>Next</span>
        <ChevronRight className="h-4 w-4" />
    </Button>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
    <span aria-hidden className={cn("flex h-9 w-9 items-center justify-center", className)} {...props}>
    ...
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export { PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious }
