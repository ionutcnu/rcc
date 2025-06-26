"use client"

import Image from "next/image"
import { useState } from "react"

interface PerformanceImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  aspectRatio?: "square" | "4/3" | "16/9" | "3/2"
  priority?: boolean
  quality?: number
  sizes?: string
}

export default function PerformanceImage({
  src,
  alt,
  width = 400,
  height = 300,
  className = "",
  aspectRatio = "4/3",
  priority = false,
  quality = 60,
  sizes = "(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
}: PerformanceImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square":
        return "aspect-square"
      case "4/3":
        return "aspect-[4/3]"
      case "16/9":
        return "aspect-video"
      case "3/2":
        return "aspect-[3/2]"
      default:
        return "aspect-[4/3]"
    }
  }

  const getBlurDataUrl = () => {
    return "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyejFBVWcT0RDGWpAgKBOzRnJ6EWmCWgLnfQe6g1oSgWIL1uGqSI5sOpDJ5sOrKFPJqLOMRZrZhSjmNyBWkZ7DdPKl/K3lNQjLzXggnm6TmqJiuxdY4EQRG9fZN8mOX1sXzgqXwqWGMU8Uh7WOJPfYctrlG3cNfTc7T8OlrGz9I9aOdJJq3P0FkGvKHLHaRJGzd/nXLJiJ8bnDFQD2v9lOrGzKRYxkLTf6/4bFOxp8Aq78YNHC6G1wZ2M7VgKMROwg3nY7y8V/TYHLGJzINfB1XW2v4KDUC89TgO13/DfkBb8KJBXPmZdmTJUyrtJJkQNOznGx/QNw9kKGCKNh3IVjJNGTfwKdJfH8TlvdN8KrCqp7kQK3QQhIY57/f"
  }

  return (
    <div className={`relative ${getAspectRatioClass()} ${className} overflow-hidden`}>
      {hasError ? (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <div className="text-2xl mb-2">🐱</div>
            <div className="text-sm">Image unavailable</div>
          </div>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          className={`object-cover transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          sizes={sizes}
          quality={quality}
          loading={priority ? "eager" : "lazy"}
          priority={priority}
          placeholder="blur"
          blurDataURL={getBlurDataUrl()}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true)
            setIsLoading(false)
          }}
        />
      )}
      
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <div className="text-2xl mb-2">🐱</div>
            <div className="text-sm">Loading...</div>
          </div>
        </div>
      )}
    </div>
  )
}