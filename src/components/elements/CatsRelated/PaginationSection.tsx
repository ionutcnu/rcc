// PaginationSection.tsx

"use client";
import React from "react";

type PaginationSectionProps = {
    currentPage: number;
    totalPages: number;
    catsPerPage: number;
    filteredCatsLength: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
};

export default function PaginationSection({
                                              currentPage,
                                              totalPages,
                                              catsPerPage,
                                              filteredCatsLength,
                                              setCurrentPage,
                                          }: PaginationSectionProps) {
    return (
        <div className="flex justify-between items-center mt-8">
      <span className="text-sm text-gray-600">
        {(currentPage - 1) * catsPerPage + 1} -{" "}
          {Math.min(currentPage * catsPerPage, filteredCatsLength)} of {filteredCatsLength}
      </span>
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg ${
                        currentPage === 1
                            ? "bg-gray-300"
                            : "bg-indigo-500 hover:bg-indigo-600 text-white"
                    }`}
                >
                    Previous
                </button>
                {Array.from({ length: totalPages }, (_, index) => (
                    <button
                        key={index + 1}
                        onClick={() => setCurrentPage(index + 1)}
                        className={`px-3 py-2 rounded-lg ${
                            currentPage === index + 1
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                        {index + 1}
                    </button>
                ))}
                <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-lg ${
                        currentPage === totalPages
                            ? "bg-gray-300"
                            : "bg-indigo-500 hover:bg-indigo-600 text-white"
                    }`}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
