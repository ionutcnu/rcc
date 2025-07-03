"use client"

import type React from "react"

type PaginationSectionProps = {
    currentPage: number
    totalPages: number
    catsPerPage: number
    filteredCatsLength: number
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>
    handleCatsPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

export default function PaginationSection({
                                              currentPage,
                                              totalPages,
                                              catsPerPage,
                                              filteredCatsLength,
                                              setCurrentPage,
                                              handleCatsPerPageChange,
                                          }: PaginationSectionProps) {
    // Calculate the range of items being displayed
    const startItem = (currentPage - 1) * catsPerPage + 1
    const endItem = Math.min(currentPage * catsPerPage, filteredCatsLength)

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm">
            <div className="flex items-center gap-4">
        <span className="text-gray-600">
          {startItem} - {endItem} of {filteredCatsLength}
        </span>

                <div className="flex items-center">
                    <label htmlFor="catsPerPage" className="text-gray-600 text-xs mr-2">
                        Cats per Page
                    </label>
                    <select
                        id="catsPerPage"
                        value={catsPerPage}
                        onChange={handleCatsPerPageChange}
                        className="border border-gray-300 rounded-md py-1 px-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 hover:border-indigo-400 transition-all duration-300 shadow-sm w-16"
                    >
                        <option value={9}>9</option>
                        <option value={18}>18</option>
                        <option value={32}>32</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center space-x-1">
                <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-2 py-1 text-xs rounded ${
                        currentPage === 1 ? "bg-gray-200 text-gray-400" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                >
                    Previous
                </button>
                {totalPages <= 5 ? (
                    // Show all pages if 5 or fewer
                    Array.from({ length: totalPages }, (_, index) => (
                        <button
                            key={index + 1}
                            onClick={() => setCurrentPage(index + 1)}
                            className={`w-7 h-7 flex items-center justify-center rounded ${
                                currentPage === index + 1 ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                            {index + 1}
                        </button>
                    ))
                ) : (
                    // Show limited pages with ellipsis for larger page counts
                    <>
                        {/* First page */}
                        <button
                            onClick={() => setCurrentPage(1)}
                            className={`w-7 h-7 flex items-center justify-center rounded ${
                                currentPage === 1 ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        >
                            1
                        </button>

                        {/* Ellipsis or second page */}
                        {currentPage > 3 && <span className="px-1 text-gray-500">...</span>}

                        {/* Pages around current page */}
                        {currentPage > 2 && currentPage < totalPages && (
                            <button
                                onClick={() => setCurrentPage(currentPage)}
                                className="w-7 h-7 flex items-center justify-center rounded bg-indigo-600 text-white"
                            >
                                {currentPage}
                            </button>
                        )}

                        {/* Ellipsis or second-to-last page */}
                        {currentPage < totalPages - 2 && <span className="px-1 text-gray-500">...</span>}

                        {/* Last page */}
                        {totalPages > 1 && (
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                className={`w-7 h-7 flex items-center justify-center rounded ${
                                    currentPage === totalPages
                                        ? "bg-indigo-600 text-white"
                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                            >
                                {totalPages}
                            </button>
                        )}
                    </>
                )}
                <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-2 py-1 text-xs rounded ${
                        currentPage === totalPages ? "bg-gray-200 text-gray-400" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                >
                    Next
                </button>
            </div>
        </div>
    )
}
