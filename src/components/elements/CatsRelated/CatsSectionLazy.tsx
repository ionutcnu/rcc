"use client"
import { lazy, Suspense } from "react"

// Lazy load heavy components
const CatsSection = lazy(() => import("./CatsSection"))

const CatsSectionSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-96 bg-gray-200 rounded-lg mb-4"></div>
    <div className="flex space-x-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-48 w-48 bg-gray-200 rounded-lg"></div>
      ))}
    </div>
  </div>
)

export default function CatsSectionLazy() {
    return (
        <Suspense fallback={<CatsSectionSkeleton />}>
            <CatsSection />
        </Suspense>
    )
}