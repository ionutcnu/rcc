"use client"

import { Button } from "@/components/ui/button"

import * as React from "react"

import { cn } from "@/lib/utils"

const PaginationContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("flex w-full items-center justify-center", className)} {...props} />
    ),
)
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<HTMLButtonElement, React.HTMLAttributes<HTMLButtonElement>>(
    ({ className, ...props }, ref) => (
        <Button variant="outline" className={cn("h-8 w-8 p-0 border-2", className)} {...props} ref={ref} />
    ),
)
PaginationItem.displayName = "PaginationItem"

const PaginationLink = React.forwardRef<HTMLAnchorElement, React.HTMLAttributes<HTMLAnchorElement>>(
    ({ className, ...props }, ref) => {
        return (
            <a
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center h-8 w-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent data-[active]:text-accent-foreground",
                    className,
                )}
                {...props}
            />
        )
    },
)
PaginationLink.displayName = "PaginationLink"

const PaginationNext = React.forwardRef<HTMLAnchorElement, React.HTMLAttributes<HTMLAnchorElement>>(
    ({ className, ...props }, ref) => {
        return (
            <PaginationLink ref={ref} className={cn("h-8 w-8 p-0 border-2", className)} {...props}>
                <span className="sr-only">Next</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                >
                    <path d="M9 18l6-6-6-6" />
                </svg>
            </PaginationLink>
        )
    },
)
PaginationNext.displayName = "PaginationNext"

const PaginationPrevious = React.forwardRef<HTMLAnchorElement, React.HTMLAttributes<HTMLAnchorElement>>(
    ({ className, ...props }, ref) => {
        return (
            <PaginationLink ref={ref} className={cn("h-8 w-8 p-0 border-2", className)} {...props}>
                <span className="sr-only">Previous</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                >
                    <path d="M15 18l-6-6 6-6" />
                </svg>
            </PaginationLink>
        )
    },
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationEllipsis = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
    ({ className, ...props }, ref) => (
        <span ref={ref} className={cn("h-8 w-8 text-sm font-medium -translate-x-2", className)} {...props}>
      ...
    </span>
    ),
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export { PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis }

interface PaginationProps {
    totalItems: number
    itemsPerPage: number
    currentPage: number
    onPageChange: (page: number) => void
}

export const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }: PaginationProps) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    const getPageNumbers = () => {
        const pageNumbers = []
        const maxPagesToShow = 5

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i)
            }
        } else {
            pageNumbers.push(1)

            let startPage = Math.max(2, currentPage - 1)
            let endPage = Math.min(totalPages - 1, currentPage + 1)

            if (currentPage <= 3) {
                endPage = 4
            }

            if (currentPage >= totalPages - 2) {
                startPage = totalPages - 3
            }

            if (startPage > 2) {
                pageNumbers.push("...")
            }

            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(i)
            }

            if (endPage < totalPages - 1) {
                pageNumbers.push("...")
            }

            pageNumbers.push(totalPages)
        }

        return pageNumbers
    }

    return (
        <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                    >
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
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
                                    onClick={() => onPageChange(page)}
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
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                    >
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                    <span className="sr-only">Next Page</span>
                </Button>
            </div>
        </div>
    )
}
