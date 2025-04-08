"use client"

import { useState } from "react"
import Image from "next/image"
import { Upload, Film, Trash2, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useCatPopup } from "@/components/CatPopupProvider"

// Mock data for demonstration
const mockMedia = [
  {
    id: "1",
    name: "whiskers_1.jpg",
    url: "/placeholder.svg?height=200&width=300",
    type: "image",
    cat: "Whiskers",
    date: "2023-10-15",
    size: "1.2 MB",
  },
  {
    id: "2",
    name: "shadow_playing.jpg",
    url: "/placeholder.svg?height=200&width=300",
    type: "image",
    cat: "Shadow",
    date: "2023-10-12",
    size: "0.8 MB",
  },
  {
    id: "3",
    name: "luna_sleeping.jpg",
    url: "/placeholder.svg?height=200&width=300",
    type: "image",
    cat: "Luna",
    date: "2023-10-10",
    size: "1.5 MB",
  },
  {
    id: "4",
    name: "whiskers_playing.mp4",
    url: "/placeholder.svg?height=200&width=300",
    type: "video",
    cat: "Whiskers",
    date: "2023-10-08",
    size: "4.2 MB",
  },
  {
    id: "5",
    name: "shadow_meowing.mp4",
    url: "/placeholder.svg?height=200&width=300",
    type: "video",
    cat: "Shadow",
    date: "2023-10-05",
    size: "3.7 MB",
  },
]

type MediaItem = (typeof mockMedia)[0]

export default function MediaManagerPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(mockMedia)
  const [activeFilter, setActiveFilter] = useState<"all" | "images" | "videos">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const { showPopup } = useCatPopup()

  const filteredItems = mediaItems
      .filter(
          (item) =>
              activeFilter === "all" ||
              (activeFilter === "images" && item.type === "image") ||
              (activeFilter === "videos" && item.type === "video"),
      )
      .filter(
          (item) =>
              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.cat.toLowerCase().includes(searchQuery.toLowerCase()),
      )

  const handleDeleteMedia = (id: string) => {
    setMediaItems(mediaItems.filter((item) => item.id !== id))
    showPopup("Media deleted successfully")
  }

  const handleUpload = () => {
    // In a real implementation, this would open a file picker and upload to Firebase Storage
    showPopup("Upload initiated")
  }

  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Media Manager</h1>
          <Button onClick={handleUpload}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Media
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-2">
                <Button
                    variant={activeFilter === "all" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveFilter("all")}
                >
                  All Media
                </Button>
                <Button
                    variant={activeFilter === "images" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveFilter("images")}
                >
                  Images
                </Button>
                <Button
                    variant={activeFilter === "videos" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveFilter("videos")}
                >
                  Videos
                </Button>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                    placeholder="Search media..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-video relative bg-muted">
                  <Image
                      src={item.url || "/placeholder.svg?height=200&width=300"}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  {item.type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Film className="h-8 w-8 text-white" />
                      </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="truncate">
                      <p className="font-medium truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {item.cat}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.size}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteMedia(item.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
          ))}
        </div>
      </div>
  )
}
