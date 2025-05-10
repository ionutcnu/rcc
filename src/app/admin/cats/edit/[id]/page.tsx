"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { ArrowLeft, Trash2, Upload, X, Loader2 } from "lucide-react"
import { getCatById, getAllCats } from "@/lib/firebase/catService"
import CatPopup from "@/components/elements/CatsRelated/CatPopup"
import type { CatProfile } from "@/lib/types/cat"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ComboboxSelect } from "@/components/ui/combobox-select"

// Form schema aligned with CatProfile interface
const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    color: z.string().min(1, "Color is required"),
    gender: z.string().min(1, "Gender is required"),
    yearOfBirth: z.coerce
      .number()
      .int()
      .min(2000, "Year must be after 2000")
      .max(new Date().getFullYear(), "Year can't be in the future"),
    isVaccinated: z.boolean(),
    isMicrochipped: z.boolean(),
    isCastrated: z.boolean(),
    breed: z.string(),
    category: z.string().min(1, "Category is required"),
    motherId: z.string().nullable(), // ✅ string or null
    fatherId: z.string().nullable(), // ✅ string or null
    availability: z.string().min(1, "Availability status is required"),
})

type FormValues = z.infer<typeof formSchema>

export default function EditCatPage() {
    const router = useRouter()
    const params = useParams()
    const catId = params.id as string

    const [images, setImages] = useState<string[]>([])
    const [videos, setVideos] = useState<string[]>([])
    const [videoFiles, setVideoFiles] = useState<File[]>([]) // New state for video files
    const [mainImage, setMainImage] = useState<string>("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [popupVisible, setPopupVisible] = useState(false)
    const [popupMessage, setPopupMessage] = useState("")
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
    const [allCats, setAllCats] = useState<CatProfile[]>([])
    const [isLoadingCats, setIsLoadingCats] = useState(true)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            color: "",
            gender: "Female",
            yearOfBirth: new Date().getFullYear(),
            isVaccinated: false,
            isMicrochipped: false,
            isCastrated: false,
            breed: "British Shorthair",
            category: "Domestic",
            motherId: null,
            fatherId: null,
            availability: "",
        },
    })

    useEffect(() => {
        const fetchCat = async () => {
            try {
                setIsLoading(true)
                const cat = await getCatById(catId)
                if (cat) {
                    // Update form with cat data
                    form.reset({
                        name: cat.name || "",
                        description: cat.description || "",
                        color: cat.color || "",
                        gender: cat.gender || "Female",
                        yearOfBirth: cat.yearOfBirth || new Date().getFullYear(),
                        isVaccinated: cat.isVaccinated || false,
                        isMicrochipped: cat.isMicrochipped || false,
                        isCastrated: cat.isCastrated || false,
                        breed: cat.breed || "",
                        category: cat.category || "",
                        motherId: cat.motherId || null,
                        fatherId: cat.fatherId || null,
                        availability: cat.availability || "Available",
                    })

                    // Add this console log to debug the gender value
                    console.log("Cat gender from database:", cat.gender)

                    if (cat.mainImage) {
                        setMainImage(cat.mainImage)
                    }
                    if (cat.images && Array.isArray(cat.images)) {
                        setImages(cat.images)
                    }
                    if (cat.videos && Array.isArray(cat.videos)) {
                        setVideos(cat.videos)
                    }
                } else {
                    setPopupMessage("Cat not found")
                    setPopupVisible(true)
                    router.push("/admin/cats")
                }
            } catch (error) {
                console.error("Error fetching cat:", error)
                setPopupMessage("Error loading cat data")
                setPopupVisible(true)
            } finally {
                setIsLoading(false)
            }
        }

        if (catId) {
            fetchCat()
        }
    }, [catId, router, form])

    useEffect(() => {
        const fetchAllCats = async () => {
            try {
                setIsLoadingCats(true)
                const fetchedCats = await getAllCats()
                console.log("Fetched cats:", fetchedCats)
                setAllCats(fetchedCats)
            } catch (error) {
                console.error("Error fetching all cats:", error)
                setPopupMessage("Error loading cat data for parent selection")
                setPopupVisible(true)
            } finally {
                setIsLoadingCats(false)
            }
        }

        fetchAllCats()
    }, [])

    // Create options for mother and father dropdowns
    const motherOptions = allCats
      .filter((cat) => {
          // Case-insensitive check for female gender and exclude current cat
          const gender = cat.gender?.toLowerCase() || ""
          return gender === "female" && cat.id !== catId
      })
      .map((cat) => ({
          value: cat.id,
          label: `${cat.name} (${cat.breed || "Unknown breed"})`,
      }))

    const fatherOptions = allCats
      .filter((cat) => {
          // Case-insensitive check for male gender and exclude current cat
          const gender = cat.gender?.toLowerCase() || ""
          return gender === "male" && cat.id !== catId
      })
      .map((cat) => ({
          value: cat.id,
          label: `${cat.name} (${cat.breed || "Unknown breed"})`,
      }))

    // Add "None" option to both
    motherOptions.unshift({ value: "", label: "None" })
    fatherOptions.unshift({ value: "", label: "None" })

    console.log("Mother options:", motherOptions)
    console.log("Father options:", fatherOptions)

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isMain = false) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files)

            files.forEach((file, index) => {
                const reader = new FileReader()

                reader.onload = () => {
                    const result = reader.result as string

                    if (isMain && index === 0) {
                        setMainImage(result)
                    }

                    setImages((prev) => {
                        if (!prev.includes(result)) {
                            return [...prev, result]
                        }
                        return prev
                    })
                }

                reader.readAsDataURL(file)
            })
        }
    }

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files)

            // Store the actual File objects
            setVideoFiles((prev) => [...prev, ...files])

            // Create preview URLs for display
            files.forEach((file) => {
                const reader = new FileReader()
                reader.onload = () => {
                    const result = reader.result as string
                    setVideos((prev) => [...prev, result])
                }
                reader.readAsDataURL(file)
            })
        }
    }

    const removeImage = (index: number) => {
        const newImages = [...images]
        const removedImage = newImages.splice(index, 1)[0]
        setImages(newImages)

        if (mainImage === removedImage) {
            setMainImage(newImages.length > 0 ? newImages[0] : "")
        }
    }

    const removeVideo = (index: number) => {
        const newVideos = [...videos]
        newVideos.splice(index, 1)
        setVideos(newVideos)

        // Also remove from videoFiles array if it's a new video
        if (index < videoFiles.length) {
            const newVideoFiles = [...videoFiles]
            newVideoFiles.splice(index, 1)
            setVideoFiles(newVideoFiles)
        }
    }

    // Helper function to remove undefined values from an object
    function removeUndefined<T extends Record<string, any>>(obj: T): T {
        return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined)) as T
    }

    // Helper function to convert base64 to File
    async function base64ToFile(base64String: string, filename: string): Promise<File> {
        // Extract file type and create a proper filename
        const mimeType = base64String.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,/)![1]
        const fileExt = mimeType.split("/")[1]
        const fileName = filename || `image-${Date.now()}.${fileExt}`

        // Convert base64 to blob
        const base64Data = base64String.split(",")[1]
        const byteCharacters = atob(base64Data)
        const byteArrays = []

        for (let i = 0; i < byteCharacters.length; i += 512) {
            const slice = byteCharacters.slice(i, i + 512)
            const byteNumbers = new Array(slice.length)

            for (let j = 0; j < slice.length; j++) {
                byteNumbers[j] = slice.charCodeAt(j)
            }

            const byteArray = new Uint8Array(byteNumbers)
            byteArrays.push(byteArray)
        }

        const blob = new Blob(byteArrays, { type: mimeType })
        return new File([blob], fileName, { type: mimeType })
    }

    const onSubmit = async (data: FormValues) => {
        if (!mainImage && images.length === 0) {
            setPopupMessage("Please upload at least one image for the cat.")
            setPopupVisible(true)
            return
        }

        setIsSubmitting(true)

        try {
            console.log("Starting file uploads...")

            // Upload images to API
            const uploadedImageUrls: string[] = []
            let uploadedMainImageUrl = ""

            // Check if mainImage is a URL or base64
            if (mainImage) {
                if (mainImage.startsWith("data:")) {
                    // It's a new image, upload it through API
                    console.log("Uploading new main image...")

                    // Convert base64 to file
                    const file = await base64ToFile(mainImage, "main-image.jpg")

                    // Create form data
                    const formData = new FormData()
                    formData.append("file", file)
                    formData.append("catId", catId)
                    formData.append("isMainImage", "true")

                    // Upload through API
                    const response = await fetch("/api/cats/upload/image", {
                        method: "POST",
                        body: formData,
                    })

                    if (!response.ok) {
                        const errorData = await response.json()
                        throw new Error(errorData.message || "Failed to upload main image")
                    }

                    const result = await response.json()
                    uploadedMainImageUrl = result.imageUrl
                    console.log("Main image uploaded:", uploadedMainImageUrl)
                } else {
                    // It's an existing URL, keep it
                    uploadedMainImageUrl = mainImage
                }
            }

            // Upload additional images
            console.log(`Processing ${images.length} images...`)
            for (const imageData of images) {
                if (imageData !== mainImage) {
                    // Avoid uploading main image twice
                    if (imageData.startsWith("data:")) {
                        // It's a new image, upload it through API
                        const file = await base64ToFile(imageData, `image-${Date.now()}.jpg`)

                        // Create form data
                        const formData = new FormData()
                        formData.append("file", file)
                        formData.append("catId", catId)
                        formData.append("isMainImage", "false")

                        // Upload through API
                        const response = await fetch("/api/cats/upload/image", {
                            method: "POST",
                            body: formData,
                        })

                        if (!response.ok) {
                            const errorData = await response.json()
                            throw new Error(errorData.message || "Failed to upload image")
                        }

                        const result = await response.json()
                        uploadedImageUrls.push(result.imageUrl)
                        console.log("Additional image uploaded:", result.imageUrl)
                    } else {
                        // It's an existing URL, keep it
                        uploadedImageUrls.push(imageData)
                    }
                }
            }

            // Upload videos
            console.log(`Processing videos...`)
            const uploadedVideoUrls: string[] = []

            // First, keep existing video URLs
            for (const videoData of videos) {
                if (!videoData.startsWith("data:")) {
                    // It's an existing URL, keep it
                    uploadedVideoUrls.push(videoData)
                }
            }

            // Then upload new video files
            for (const videoFile of videoFiles) {
                try {
                    console.log("Uploading video file:", videoFile.name)

                    // Create form data
                    const formData = new FormData()
                    formData.append("file", videoFile)
                    formData.append("catId", catId)

                    // Upload through API
                    const response = await fetch("/api/cats/upload/video", {
                        method: "POST",
                        body: formData,
                    })

                    if (!response.ok) {
                        const errorData = await response.json()
                        throw new Error(errorData.message || "Failed to upload video")
                    }

                    const result = await response.json()
                    uploadedVideoUrls.push(result.videoUrl)
                    console.log("Video uploaded:", result.videoUrl)
                } catch (error) {
                    console.error("Error uploading video file:", error)
                    // Continue with other videos even if one fails
                }
            }

            console.log("All files uploaded successfully")

            // Update cat entry with uploaded URLs
            const catEntry = {
                id: catId,
                name: data.name,
                description: data.description,
                mainImage: uploadedMainImageUrl || (uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : ""),
                images: uploadedImageUrls,
                videos: uploadedVideoUrls,
                color: data.color,
                gender: data.gender,
                yearOfBirth: data.yearOfBirth,
                isVaccinated: data.isVaccinated,
                isMicrochipped: data.isMicrochipped,
                isCastrated: data.isCastrated,
                breed: data.breed,
                category: data.category,
                motherId: data.motherId || null,
                fatherId: data.fatherId || null,
                availability: data.availability,
            }

            // Remove any undefined values before sending to API
            const cleanCatEntry = removeUndefined(catEntry)

            console.log("Updating cat data via API:", cleanCatEntry)

            // Use the API route instead of direct Firebase call
            console.log("Sending update request to API:", cleanCatEntry)
            const response = await fetch("/api/cats/update", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(cleanCatEntry),
            })

            if (!response.ok) {
                const errorData = await response.json()
                console.error("API error response:", errorData)
                throw new Error(errorData.message || "Failed to update cat")
            }

            const result = await response.json()
            console.log("Cat data updated successfully:", result)

            setPopupMessage(`${data.name} has been updated successfully.`)
            setPopupVisible(true)

            // Navigate back to cats list after a short delay
            setTimeout(() => {
                router.push("/admin/cats")
            }, 2000)
        } catch (error) {
            console.error("Error submitting form:", error)
            setPopupMessage("There was a problem updating the cat entry.")
            setPopupVisible(true)
        } finally {
            setIsSubmitting(false)
        }
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
            },
        },
    }

    if (isLoading) {
        return (
          <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
              <span className="ml-2">Loading cat data...</span>
          </div>
        )
    }

    return (
      <div className="container mx-auto py-10 px-4 sm:px-6 max-w-5xl">
          <motion.div initial="hidden" animate="visible" variants={containerVariants}>
              <motion.div variants={itemVariants} className="mb-6">
                  <Button variant="ghost" size="sm" asChild className="mb-4">
                      <Link href="/admin/cats">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back to Cats
                      </Link>
                  </Button>
              </motion.div>

              <motion.div variants={itemVariants}>
                  <Card className="border border-gray-200 shadow-xl rounded-xl overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 border-b pb-8 pt-6">
                          <CardTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                              Edit Cat: {form.getValues("name")}
                          </CardTitle>
                          <CardDescription className="text-center text-base mt-2">
                              Update the details of this cat in the database
                          </CardDescription>
                      </CardHeader>

                      <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)}>
                              <CardContent className="space-y-10 pt-8 px-6 sm:px-8">
                                  <motion.div variants={itemVariants} className="grid sm:grid-cols-1 md:grid-cols-2 gap-8">
                                      {/* Basic Information */}
                                      <div className="space-y-4">
                                          <h3 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-100">Basic Information</h3>

                                          <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                              <FormItem className="mb-5">
                                                  <FormLabel className="text-base">Name</FormLabel>
                                                  <FormControl>
                                                      <Input {...field} className="h-11" />
                                                  </FormControl>
                                                  <FormMessage />
                                              </FormItem>
                                            )}
                                          />

                                          <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                              <FormItem className="mb-5">
                                                  <FormLabel className="text-base">Description</FormLabel>
                                                  <FormControl>
                                                      <Textarea placeholder="Describe the cat..." {...field} className="h-28" />
                                                  </FormControl>
                                                  <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                      </div>

                                      {/* Images & Videos */}
                                      <div className="space-y-4">
                                          <h3 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-100">Images & Videos</h3>

                                          <div className="space-y-3">
                                              <Label htmlFor="mainImage" className="text-base flex items-center">
                                                  Main Image <span className="text-red-500 ml-1">*</span>
                                              </Label>
                                              <div className="flex items-center gap-2">
                                                  <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => document.getElementById("mainImage")?.click()}
                                                    className="w-full h-12 border-dashed border-2 hover:bg-pink-50 transition-colors"
                                                  >
                                                      <Upload className="mr-2 h-5 w-5 text-pink-500" />{" "}
                                                      {mainImage ? "Change Main Image" : "Upload Main Image"}
                                                  </Button>
                                                  <input
                                                    id="mainImage"
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleImageUpload(e, true)}
                                                  />
                                              </div>

                                              {mainImage && (
                                                <div className="relative mt-3 inline-block">
                                                    <img
                                                      src={mainImage || "/placeholder.svg"}
                                                      alt="Main cat image"
                                                      className="h-24 w-24 object-cover rounded-lg border-2 border-pink-300 shadow-sm"
                                                    />
                                                    <span className="absolute -top-2 -right-2 bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md">
                              ★
                            </span>
                                                </div>
                                              )}
                                          </div>

                                          <div className="space-y-2">
                                              <Label htmlFor="additionalImages" className="text-base">
                                                  Additional Images
                                              </Label>
                                              <div className="flex items-center gap-2">
                                                  <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => document.getElementById("additionalImages")?.click()}
                                                    className="w-full h-12 border-dashed border-2 hover:bg-pink-50 transition-colors"
                                                  >
                                                      <Upload className="mr-2 h-5 w-5 text-pink-500" /> Add Multiple Images
                                                  </Button>
                                                  <input
                                                    id="additionalImages"
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={handleImageUpload}
                                                  />
                                              </div>

                                              {images.length > 0 && (
                                                <div className="flex flex-wrap gap-3 mt-4">
                                                    {images.map((img, index) => (
                                                      <div key={index} className="relative group">
                                                          <img
                                                            src={img || "/placeholder.svg"}
                                                            alt={`Cat image ${index + 1}`}
                                                            className={`h-20 w-20 object-cover rounded-lg transition-all hover:scale-105 cursor-pointer ${
                                                              mainImage === img
                                                                ? "border-2 border-pink-300 ring-2 ring-pink-200"
                                                                : "border border-gray-200"
                                                            }`}
                                                            onClick={() => setMainImage(img)}
                                                          />
                                                          <button
                                                            type="button"
                                                            onClick={() => removeImage(index)}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-90 hover:opacity-100 shadow-sm"
                                                          >
                                                              <X className="h-3 w-3" />
                                                          </button>
                                                      </div>
                                                    ))}
                                                </div>
                                              )}
                                          </div>

                                          <div className="space-y-2">
                                              <Label htmlFor="videos" className="text-base">
                                                  Videos
                                              </Label>
                                              <div className="flex items-center gap-2">
                                                  <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => document.getElementById("videos")?.click()}
                                                    className="w-full h-12 border-dashed border-2 hover:bg-pink-50 transition-colors"
                                                  >
                                                      <Upload className="mr-2 h-5 w-5 text-pink-500" /> Add Multiple Videos
                                                  </Button>
                                                  <input
                                                    id="videos"
                                                    type="file"
                                                    accept="video/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={handleVideoUpload}
                                                  />
                                              </div>

                                              {videos.length > 0 && (
                                                <div className="space-y-2 mt-4">
                                                    {videos.map((video, index) => (
                                                      <div
                                                        key={index}
                                                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                                                      >
                                                          <span className="text-sm font-medium truncate max-w-[200px]">Video {index + 1}</span>
                                                          <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeVideo(index)}
                                                            className="hover:bg-red-50 hover:text-red-500"
                                                          >
                                                              <Trash2 className="h-4 w-4 text-red-400" />
                                                          </Button>
                                                      </div>
                                                    ))}
                                                </div>
                                              )}
                                          </div>
                                      </div>
                                  </motion.div>

                                  <motion.div variants={itemVariants}>
                                      <hr className="my-6" />
                                  </motion.div>

                                  <motion.div variants={itemVariants} className="grid sm:grid-cols-1 md:grid-cols-2 gap-8">
                                      {/* Physical Characteristics */}
                                      <div className="space-y-4">
                                          <h3 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-100">
                                              Physical Characteristics
                                          </h3>

                                          <FormField
                                            control={form.control}
                                            name="color"
                                            render={({ field }) => (
                                              <FormItem className="mb-5">
                                                  <FormLabel className="text-base">Color</FormLabel>
                                                  <FormControl>
                                                      <Input placeholder="e.g. White" {...field} className="h-11" />
                                                  </FormControl>
                                                  <FormMessage />
                                              </FormItem>
                                            )}
                                          />

                                          <FormField
                                            control={form.control}
                                            name="gender"
                                            render={({ field }) => (
                                              <FormItem className="mb-5">
                                                  <FormLabel className="text-base">Gender</FormLabel>
                                                  <Select
                                                    onValueChange={field.onChange}
                                                    value={
                                                        field.value ? (field.value.toLowerCase() === "male" ? "Male" : "Female") : "Female"
                                                    }
                                                  >
                                                      <FormControl>
                                                          <SelectTrigger className="h-11">
                                                              <SelectValue placeholder="Select gender" />
                                                          </SelectTrigger>
                                                      </FormControl>
                                                      <SelectContent>
                                                          <SelectItem value="Female">Female</SelectItem>
                                                          <SelectItem value="Male">Male</SelectItem>
                                                      </SelectContent>
                                                  </Select>
                                                  <FormMessage />
                                              </FormItem>
                                            )}
                                          />

                                          <FormField
                                            control={form.control}
                                            name="yearOfBirth"
                                            render={({ field }) => (
                                              <FormItem className="mb-5">
                                                  <FormLabel className="text-base">Year of Birth</FormLabel>
                                                  <FormControl>
                                                      <Input type="number" {...field} className="h-11" />
                                                  </FormControl>
                                                  <FormMessage />
                                              </FormItem>
                                            )}
                                          />

                                          <FormField
                                            control={form.control}
                                            name="breed"
                                            render={({ field }) => (
                                              <FormItem className="mb-5">
                                                  <FormLabel className="text-base">Breed</FormLabel>
                                                  <FormControl>
                                                      <Input placeholder="e.g. Persian" {...field} className="h-11" />
                                                  </FormControl>
                                                  <FormMessage />
                                              </FormItem>
                                            )}
                                          />

                                          <FormField
                                            control={form.control}
                                            name="category"
                                            render={({ field }) => (
                                              <FormItem className="mb-5">
                                                  <FormLabel className="text-base">Category</FormLabel>
                                                  <Select onValueChange={field.onChange} value={field.value}>
                                                      <FormControl>
                                                          <SelectTrigger className="h-11">
                                                              <SelectValue placeholder="Select category" />
                                                          </SelectTrigger>
                                                      </FormControl>
                                                      <SelectContent>
                                                          <SelectItem value="Domestic">Domestic</SelectItem>
                                                          <SelectItem value="Wild">Wild</SelectItem>
                                                      </SelectContent>
                                                  </Select>
                                                  <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                      </div>

                                      {/* Additional Information */}
                                      <div className="space-y-4">
                                          <h3 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-100">
                                              Additional Information
                                          </h3>

                                          <div className="space-y-4">
                                              <FormField
                                                control={form.control}
                                                name="isVaccinated"
                                                render={({ field }) => (
                                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm hover:bg-gray-50 transition-colors">
                                                      <div className="space-y-1">
                                                          <FormLabel className="text-base">Vaccinated</FormLabel>
                                                          <FormDescription>Has this cat received all necessary vaccinations?</FormDescription>
                                                      </div>
                                                      <FormControl>
                                                          <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            className="data-[state=checked]:bg-pink-500"
                                                          />
                                                      </FormControl>
                                                  </FormItem>
                                                )}
                                              />

                                              <FormField
                                                control={form.control}
                                                name="isMicrochipped"
                                                render={({ field }) => (
                                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm hover:bg-gray-50 transition-colors">
                                                      <div className="space-y-1">
                                                          <FormLabel className="text-base">Microchipped</FormLabel>
                                                          <FormDescription>Does this cat have an identification microchip?</FormDescription>
                                                      </div>
                                                      <FormControl>
                                                          <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            className="data-[state=checked]:bg-pink-500"
                                                          />
                                                      </FormControl>
                                                  </FormItem>
                                                )}
                                              />

                                              <FormField
                                                control={form.control}
                                                name="isCastrated"
                                                render={({ field }) => (
                                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm hover:bg-gray-50 transition-colors">
                                                      <div className="space-y-1">
                                                          <FormLabel className="text-base">Castrated/Spayed</FormLabel>
                                                          <FormDescription>Has this cat been castrated or spayed?</FormDescription>
                                                      </div>
                                                      <FormControl>
                                                          <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            className="data-[state=checked]:bg-pink-500"
                                                          />
                                                      </FormControl>
                                                  </FormItem>
                                                )}
                                              />
                                          </div>

                                          <div className="grid grid-cols-2 gap-4">
                                              <FormField
                                                control={form.control}
                                                name="motherId"
                                                render={({ field }) => (
                                                  <FormItem className="mb-5">
                                                      <FormLabel className="text-base">Mother Cat</FormLabel>
                                                      <FormControl>
                                                          <ComboboxSelect
                                                            options={motherOptions}
                                                            value={field.value || ""}
                                                            onValueChange={(value) => {
                                                                console.log("Mother selected:", value)
                                                                // Explicitly handle the value change - use empty string instead of null
                                                                field.onChange(value)
                                                                // Force a form state update - use empty string instead of null
                                                                form.setValue("motherId", value)
                                                            }}
                                                            placeholder="Select mother cat"
                                                            searchPlaceholder="Search cats..."
                                                            emptyMessage={isLoadingCats ? "Loading cats..." : "No female cats found."}
                                                            className="h-11"
                                                          />
                                                      </FormControl>
                                                      <FormMessage />
                                                  </FormItem>
                                                )}
                                              />

                                              <FormField
                                                control={form.control}
                                                name="fatherId"
                                                render={({ field }) => (
                                                  <FormItem className="mb-5">
                                                      <FormLabel className="text-base">Father Cat</FormLabel>
                                                      <FormControl>
                                                          <ComboboxSelect
                                                            options={fatherOptions}
                                                            value={field.value || ""}
                                                            onValueChange={(value) => {
                                                                console.log("Father selected:", value)
                                                                // Explicitly handle the value change - use empty string instead of null
                                                                field.onChange(value)
                                                                // Force a form state update - use empty string instead of null
                                                                form.setValue("fatherId", value)
                                                            }}
                                                            placeholder="Select father cat"
                                                            searchPlaceholder="Search cats..."
                                                            emptyMessage={isLoadingCats ? "Loading cats..." : "No male cats found."}
                                                            className="h-11"
                                                          />
                                                      </FormControl>
                                                      <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                          </div>

                                          <FormField
                                            control={form.control}
                                            name="availability"
                                            render={({ field }) => (
                                              <FormItem className="mb-5">
                                                  <FormLabel className="text-base">Availability</FormLabel>
                                                  <Select onValueChange={field.onChange} value={field.value}>
                                                      <FormControl>
                                                          <SelectTrigger className="h-11">
                                                              <SelectValue placeholder="Select availability" />
                                                          </SelectTrigger>
                                                      </FormControl>
                                                      <SelectContent>
                                                          <SelectItem value="Available">Available</SelectItem>
                                                          <SelectItem value="Reserved">Reserved</SelectItem>
                                                          <SelectItem value="Stays in cattery">Stays in cattery</SelectItem>
                                                      </SelectContent>
                                                  </Select>
                                                  <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                      </div>
                                  </motion.div>
                              </CardContent>

                              <CardFooter className="flex justify-between border-t p-8 bg-gradient-to-r from-pink-50 to-purple-50 rounded-b-xl gap-4">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push("/admin/cats")}
                                    className="px-6 border-gray-300 hover:bg-white"
                                  >
                                      Cancel
                                  </Button>
                                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                      <Button
                                        type="submit"
                                        className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 h-11 text-base shadow-md hover:shadow-lg transition-shadow"
                                        disabled={isSubmitting}
                                      >
                                          {isSubmitting ? (
                                            <div className="flex items-center">
                                                <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                                Saving...
                                            </div>
                                          ) : (
                                            "Update Cat"
                                          )}
                                      </Button>
                                  </motion.div>
                              </CardFooter>
                          </form>
                      </Form>
                  </Card>
              </motion.div>
          </motion.div>

          <CatPopup visible={popupVisible} message={popupMessage} onClose={() => setPopupVisible(false)} />
      </div>
    )
}
