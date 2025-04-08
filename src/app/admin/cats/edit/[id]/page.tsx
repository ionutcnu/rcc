"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { getCatById, updateCat } from "@/lib/firebase/catService"
import { uploadCatImage, uploadCatVideo } from "@/lib/firebase/storageService"
import { useCatPopup } from "@/components/CatPopupProvider"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Upload, Loader2, X, Plus, Film } from "lucide-react"
import type { CatProfile } from "@/lib/types/cat"

export default function EditCatPage() {
    const router = useRouter()
    const params = useParams()
    const catId = params.id as string
    const { showPopup } = useCatPopup()

    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [mainImageFile, setMainImageFile] = useState<File | null>(null)
    const [mainImagePreview, setMainImagePreview] = useState<string | null>(null)
    const [additionalImageFiles, setAdditionalImageFiles] = useState<File[]>([])
    const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([])
    const [existingImages, setExistingImages] = useState<string[]>([])

    // Video states
    const [videoFiles, setVideoFiles] = useState<File[]>([])
    const [existingVideos, setExistingVideos] = useState<string[]>([])

    const [catData, setCatData] = useState<Partial<CatProfile>>({
        name: "",
        breed: "",
        gender: "male",
        color: "",
        yearOfBirth: new Date().getFullYear(),
        description: "",
        isVaccinated: false,
        isMicrochipped: false,
        isCastrated: false,
        mainImage: "",
        images: [],
        videos: [],
        category: "",
        availability: "available",
    })

    useEffect(() => {
        const fetchCat = async () => {
            try {
                setIsLoading(true)
                const cat = await getCatById(catId)
                if (cat) {
                    setCatData(cat)
                    if (cat.mainImage) {
                        setMainImagePreview(cat.mainImage)
                    }
                    if (cat.images && Array.isArray(cat.images)) {
                        setExistingImages(cat.images)
                    }
                    if (cat.videos && Array.isArray(cat.videos)) {
                        setExistingVideos(cat.videos)
                    }
                } else {
                    showPopup("Cat not found")
                    router.push("/admin/cats")
                }
            } catch (error) {
                console.error("Error fetching cat:", error)
                showPopup("Error loading cat data")
            } finally {
                setIsLoading(false)
            }
        }

        if (catId) {
            fetchCat()
        }
    }, [catId, router, showPopup])

    const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setMainImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setMainImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleAdditionalImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            const newFiles = Array.from(files)
            setAdditionalImageFiles((prev) => [...prev, ...newFiles])

            // Create previews for the new files
            newFiles.forEach((file) => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    setAdditionalImagePreviews((prev) => [...prev, reader.result as string])
                }
                reader.readAsDataURL(file)
            })
        }
    }

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            const newFiles = Array.from(files)
            setVideoFiles((prev) => [...prev, ...newFiles])
        }
    }

    const removeExistingImage = (index: number) => {
        setExistingImages(existingImages.filter((_, i) => i !== index))
    }

    const removeAdditionalImage = (index: number) => {
        setAdditionalImageFiles(additionalImageFiles.filter((_, i) => i !== index))
        setAdditionalImagePreviews(additionalImagePreviews.filter((_, i) => i !== index))
    }

    const removeExistingVideo = (index: number) => {
        setExistingVideos(existingVideos.filter((_, i) => i !== index))
    }

    const removeVideoFile = (index: number) => {
        setVideoFiles(videoFiles.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            setIsSubmitting(true)
            const updatedCatData = { ...catData }

            // Upload main image if changed
            if (mainImageFile) {
                const mainImageUrl = await uploadCatImage(mainImageFile, catId, "main")
                updatedCatData.mainImage = mainImageUrl
            }

            // Upload additional images if any
            if (additionalImageFiles.length > 0) {
                const newImageUrls = await Promise.all(
                    additionalImageFiles.map((file, index) => uploadCatImage(file, catId, `additional_${index}`)),
                )

                // Combine existing images (that weren't removed) with new ones
                updatedCatData.images = [...existingImages, ...newImageUrls]
            } else {
                // Just use the remaining existing images
                updatedCatData.images = existingImages
            }

            // Upload videos if any
            if (videoFiles.length > 0) {
                const newVideoUrls = await Promise.all(
                    videoFiles.map((file, index) => uploadCatVideo(file, catId, `video_${index}`)),
                )

                // Combine existing videos (that weren't removed) with new ones
                updatedCatData.videos = [...existingVideos, ...newVideoUrls]
            } else {
                // Just use the remaining existing videos
                updatedCatData.videos = existingVideos
            }

            // Update the cat in Firestore
            await updateCat(catId, updatedCatData)
            showPopup("Cat updated successfully")
            router.push("/admin/cats")
        } catch (error) {
            console.error("Error updating cat:", error)
            showPopup("Error updating cat")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <span className="ml-2">Loading cat data...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center">
                <Button variant="ghost" size="sm" asChild className="mr-4">
                    <Link href="/admin/cats">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Cats
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">Edit Cat: {catData.name}</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Cat Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        required
                                        value={catData.name || ""}
                                        onChange={(e) => setCatData({ ...catData, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="breed">Breed *</Label>
                                    <Input
                                        id="breed"
                                        required
                                        value={catData.breed || ""}
                                        onChange={(e) => setCatData({ ...catData, breed: e.target.value })}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select
                                        value={catData.gender || "male"}
                                        onValueChange={(value) => setCatData({ ...catData, gender: value })}
                                    >
                                        <SelectTrigger id="gender">
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="color">Color</Label>
                                    <Input
                                        id="color"
                                        value={catData.color || ""}
                                        onChange={(e) => setCatData({ ...catData, color: e.target.value })}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="yearOfBirth">Year of Birth</Label>
                                    <Input
                                        id="yearOfBirth"
                                        type="number"
                                        min={2000}
                                        max={new Date().getFullYear()}
                                        value={catData.yearOfBirth || new Date().getFullYear()}
                                        onChange={(e) => setCatData({ ...catData, yearOfBirth: Number(e.target.value) })}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select
                                        value={catData.category || ""}
                                        onValueChange={(value) => setCatData({ ...catData, category: value })}
                                    >
                                        <SelectTrigger id="category">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="kitten">Kitten</SelectItem>
                                            <SelectItem value="adult">Adult</SelectItem>
                                            <SelectItem value="senior">Senior</SelectItem>
                                            <SelectItem value="breeding">Breeding</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="availability">Availability</Label>
                                    <Select
                                        value={catData.availability || "available"}
                                        onValueChange={(value) => setCatData({ ...catData, availability: value })}
                                    >
                                        <SelectTrigger id="availability">
                                            <SelectValue placeholder="Select availability" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="available">Available</SelectItem>
                                            <SelectItem value="reserved">Reserved</SelectItem>
                                            <SelectItem value="adopted">Adopted</SelectItem>
                                            <SelectItem value="not-available">Not Available</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        rows={5}
                                        value={catData.description || ""}
                                        onChange={(e) => setCatData({ ...catData, description: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="isVaccinated"
                                            checked={catData.isVaccinated || false}
                                            onCheckedChange={(checked) => setCatData({ ...catData, isVaccinated: checked })}
                                        />
                                        <Label htmlFor="isVaccinated">Vaccinated</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="isMicrochipped"
                                            checked={catData.isMicrochipped || false}
                                            onCheckedChange={(checked) => setCatData({ ...catData, isMicrochipped: checked })}
                                        />
                                        <Label htmlFor="isMicrochipped">Microchipped</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="isCastrated"
                                            checked={catData.isCastrated || false}
                                            onCheckedChange={(checked) => setCatData({ ...catData, isCastrated: checked })}
                                        />
                                        <Label htmlFor="isCastrated">Castrated</Label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Image Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Main Image</h3>
                            <div className="flex items-center gap-4">
                                <Button type="button" variant="outline" onClick={() => document.getElementById("mainImage")?.click()}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {mainImagePreview ? "Change Image" : "Upload Image"}
                                </Button>
                                <Input
                                    id="mainImage"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleMainImageChange}
                                />

                                {mainImagePreview && (
                                    <div className="relative h-24 w-24 rounded overflow-hidden">
                                        <Image
                                            src={mainImagePreview || "/placeholder.svg"}
                                            alt="Main cat image"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Additional Images Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Additional Images</h3>

                            {/* Existing Images */}
                            {existingImages.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Current Images</h4>
                                    <div className="flex flex-wrap gap-4">
                                        {existingImages.map((imageUrl, index) => (
                                            <div key={`existing-${index}`} className="relative h-24 w-24 rounded overflow-hidden">
                                                <Image
                                                    src={imageUrl || "/placeholder.svg"}
                                                    alt={`Cat image ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                                                    onClick={() => removeExistingImage(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Images */}
                            {additionalImagePreviews.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">New Images</h4>
                                    <div className="flex flex-wrap gap-4">
                                        {additionalImagePreviews.map((preview, index) => (
                                            <div key={`new-${index}`} className="relative h-24 w-24 rounded overflow-hidden">
                                                <Image
                                                    src={preview || "/placeholder.svg"}
                                                    alt={`New cat image ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                                                    onClick={() => removeAdditionalImage(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById("additionalImages")?.click()}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Images
                                </Button>
                                <Input
                                    id="additionalImages"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleAdditionalImageChange}
                                />
                            </div>
                        </div>

                        {/* Videos Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Videos</h3>

                            {/* Existing Videos */}
                            {existingVideos.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Current Videos</h4>
                                    <div className="flex flex-wrap gap-4">
                                        {existingVideos.map((videoUrl, index) => (
                                            <div key={`existing-video-${index}`} className="relative">
                                                <div className="h-24 w-36 bg-gray-100 rounded flex items-center justify-center">
                                                    <Film className="h-8 w-8 text-gray-400" />
                                                </div>
                                                <div className="mt-1 text-sm truncate max-w-[144px]">Video {index + 1}</div>
                                                <button
                                                    type="button"
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                                                    onClick={() => removeExistingVideo(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Videos */}
                            {videoFiles.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">New Videos</h4>
                                    <div className="flex flex-wrap gap-4">
                                        {videoFiles.map((file, index) => (
                                            <div key={`new-video-${index}`} className="relative">
                                                <div className="h-24 w-36 bg-gray-100 rounded flex items-center justify-center">
                                                    <Film className="h-8 w-8 text-gray-400" />
                                                </div>
                                                <div className="mt-1 text-sm truncate max-w-[144px]">{file.name}</div>
                                                <button
                                                    type="button"
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                                                    onClick={() => removeVideoFile(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <Button type="button" variant="outline" onClick={() => document.getElementById("videos")?.click()}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Videos
                                </Button>
                                <Input
                                    id="videos"
                                    type="file"
                                    accept="video/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleVideoChange}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" type="button" asChild>
                            <Link href="/admin/cats">Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    )
}
