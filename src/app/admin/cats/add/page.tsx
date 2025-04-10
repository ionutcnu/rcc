"use client"

import { uploadFileAndGetURL } from "@/lib/firebase/storageService"
import type React from "react"
import { serverTimestamp } from "firebase/firestore"
import { useState } from "react"
import { motion } from "framer-motion"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Trash2, Upload, X } from "lucide-react"
import { addCat } from "@/lib/firebase/catService"
import CatPopup from "@/components/elements/CatsRelated/CatPopup"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

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
    breed: z.string().min(1, "Breed is required"),
    category: z.string().min(1, "Category is required"),
    motherId: z.string().nullable(), // ✅ string or null
    fatherId: z.string().nullable(), // ✅ string or null
    availability: z.string().min(1, "Availability status is required"),
})

type FormValues = z.infer<typeof formSchema>

export default function CatEntryForm() {
    const [images, setImages] = useState<string[]>([])
    const [videos, setVideos] = useState<string[]>([])
    const [mainImage, setMainImage] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [popupVisible, setPopupVisible] = useState(false)
    const [popupMessage, setPopupMessage] = useState("")
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})

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
            breed: "",
            category: "Domestic",
            motherId: null,
            fatherId: null,
            availability: "Available",
        },
    })

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
    }

    // Helper function to convert base64 to file and upload
    async function uploadBase64Image(base64String: string, folder: string): Promise<string> {
        try {
            // Extract file type and create a proper filename
            const mimeType = base64String.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,/)![1]
            const fileExt = mimeType.split("/")[1]

            // Convert base64 to file
            const fetchResponse = await fetch(base64String)
            const blob = await fetchResponse.blob()
            const file = new File([blob], `image-${Date.now()}.${fileExt}`, { type: mimeType })

            // Upload to Firebase Storage
            return await uploadFileAndGetURL(file, folder)
        } catch (error) {
            console.error("Error uploading image:", error)
            throw error
        }
    }

    // Helper function for videos
    async function uploadBase64Video(base64String: string, folder: string): Promise<string> {
        try {
            // Extract file type and create a proper filename
            const mimeType = base64String.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,/)![1]
            const fileExt = mimeType.split("/")[1]

            const fetchResponse = await fetch(base64String)
            const blob = await fetchResponse.blob()
            const file = new File([blob], `video-${Date.now()}.${fileExt}`, { type: mimeType })

            return await uploadFileAndGetURL(file, folder)
        } catch (error) {
            console.error("Error uploading video:", error)
            throw error
        }
    }

    // Helper function to remove undefined values from an object
    function removeUndefined<T extends Record<string, any>>(obj: T): T {
        return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined)) as T
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

            // Upload images to Firebase Storage
            const uploadedImageUrls: string[] = []
            let uploadedMainImageUrl = ""

            // Upload main image first
            if (mainImage) {
                console.log("Uploading main image...")
                uploadedMainImageUrl = await uploadBase64Image(mainImage, "cats/images")
                console.log("Main image uploaded:", uploadedMainImageUrl)
            }

            // Upload additional images
            console.log(`Uploading ${images.length} additional images...`)
            for (const imageBase64 of images) {
                if (imageBase64 !== mainImage) {
                    // Avoid uploading main image twice
                    const imageUrl = await uploadBase64Image(imageBase64, "cats/images")
                    uploadedImageUrls.push(imageUrl)
                    console.log("Additional image uploaded:", imageUrl)
                }
            }

            // Upload videos to Firebase Storage
            console.log(`Uploading ${videos.length} videos...`)
            const uploadedVideoUrls: string[] = []
            for (const videoBase64 of videos) {
                const videoUrl = await uploadBase64Video(videoBase64, "cats/videos")
                uploadedVideoUrls.push(videoUrl)
                console.log("Video uploaded:", videoUrl)
            }

            console.log("All files uploaded successfully")

            // Create cat entry with uploaded URLs
            const catEntry = {
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
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isDeleted: false,
            }

            // Remove any undefined values before sending to Firestore
            const cleanCatEntry = removeUndefined(catEntry)

            console.log("Saving cat data to Firestore:", cleanCatEntry)
            await addCat(cleanCatEntry)
            console.log("Cat data saved successfully")

            setPopupMessage(`${data.name} has been added to the database.`)
            setPopupVisible(true)

            form.reset()
            setImages([])
            setVideos([])
            setMainImage("")
        } catch (error) {
            console.error("Error submitting form:", error)
            setPopupMessage("There was a problem adding the cat entry.")
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

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
                <motion.div variants={itemVariants}>
                    <Card className="border-2 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-t-lg">
                            <CardTitle className="text-2xl font-bold text-center">Add New Cat</CardTitle>
                            <CardDescription className="text-center">
                                Enter the details to add a new cat to the database
                            </CardDescription>
                        </CardHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <CardContent className="space-y-6 pt-6">
                                    <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">
                                        {/* Basic Information */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold">Basic Information</h3>

                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. Gura Mare" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Description</FormLabel>
                                                        <FormControl>
                                                            <Textarea placeholder="Describe the cat..." {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Images & Videos */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold">Images & Videos</h3>

                                            <div className="space-y-2">
                                                <Label htmlFor="mainImage">
                                                    Main Image <span className="text-red-500">*</span>
                                                </Label>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => document.getElementById("mainImage")?.click()}
                                                        className="w-full"
                                                    >
                                                        <Upload className="mr-2 h-4 w-4" /> Upload Main Image
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
                                                    <div className="relative mt-2 inline-block">
                                                        <img
                                                            src={mainImage || "/placeholder.svg"}
                                                            alt="Main cat image"
                                                            className="h-20 w-20 object-cover rounded-md border-2 border-pink-300"
                                                        />
                                                        <span className="absolute -top-2 -right-2 bg-pink-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                              ★
                            </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="additionalImages">Additional Images</Label>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => document.getElementById("additionalImages")?.click()}
                                                        className="w-full"
                                                    >
                                                        <Upload className="mr-2 h-4 w-4" /> Add Multiple Images
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
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {images.map((img, index) => (
                                                            <div key={index} className="relative">
                                                                <img
                                                                    src={img || "/placeholder.svg"}
                                                                    alt={`Cat image ${index + 1}`}
                                                                    className={`h-16 w-16 object-cover rounded-md ${mainImage === img ? "border-2 border-pink-300" : ""}`}
                                                                    onClick={() => setMainImage(img)}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeImage(index)}
                                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="videos">Videos</Label>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => document.getElementById("videos")?.click()}
                                                        className="w-full"
                                                    >
                                                        <Upload className="mr-2 h-4 w-4" /> Add Multiple Videos
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
                                                    <div className="space-y-2 mt-2">
                                                        {videos.map((video, index) => (
                                                            <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                                                                <span className="text-sm truncate max-w-[200px]">Video {index + 1}</span>
                                                                <Button type="button" variant="ghost" size="sm" onClick={() => removeVideo(index)}>
                                                                    <Trash2 className="h-4 w-4 text-red-500" />
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

                                    <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6">
                                        {/* Physical Characteristics */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold">Physical Characteristics</h3>

                                            <FormField
                                                control={form.control}
                                                name="color"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Color</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. White" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="gender"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Gender</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
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
                                                    <FormItem>
                                                        <FormLabel>Year of Birth</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="breed"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Breed</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. Persian" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="category"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Category</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select category" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="Domestic">Domestic</SelectItem>
                                                                <SelectItem value="Exotic">Exotic</SelectItem>
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
                                            <h3 className="text-lg font-semibold">Additional Information</h3>

                                            <div className="space-y-4">
                                                <FormField
                                                    control={form.control}
                                                    name="isVaccinated"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                            <div className="space-y-0.5">
                                                                <FormLabel>Vaccinated</FormLabel>
                                                                <FormDescription>Has this cat received all necessary vaccinations?</FormDescription>
                                                            </div>
                                                            <FormControl>
                                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="isMicrochipped"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                            <div className="space-y-0.5">
                                                                <FormLabel>Microchipped</FormLabel>
                                                                <FormDescription>Does this cat have an identification microchip?</FormDescription>
                                                            </div>
                                                            <FormControl>
                                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="isCastrated"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                                            <div className="space-y-0.5">
                                                                <FormLabel>Castrated/Spayed</FormLabel>
                                                                <FormDescription>Has this cat been castrated or spayed?</FormDescription>
                                                            </div>
                                                            <FormControl>
                                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                                                        <FormItem>
                                                            <FormLabel>Mother ID</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="text"
                                                                    placeholder="Optional"
                                                                    {...field}
                                                                    value={field.value === null ? "" : field.value}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value
                                                                        field.onChange(value || null)
                                                                    }}
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
                                                        <FormItem>
                                                            <FormLabel>Father ID</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="text"
                                                                    placeholder="Optional"
                                                                    {...field}
                                                                    value={field.value === null ? "" : field.value}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value
                                                                        field.onChange(value || null)
                                                                    }}
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
                                                    <FormItem>
                                                        <FormLabel>Availability</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select availability" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="Available">Available</SelectItem>
                                                                <SelectItem value="Pending">Pending</SelectItem>
                                                                <SelectItem value="Adopted">Adopted</SelectItem>
                                                                <SelectItem value="Not Available">Not Available</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </motion.div>
                                </CardContent>

                                <CardFooter className="flex justify-between border-t p-6 bg-gray-50 rounded-b-lg">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            form.reset()
                                            setImages([])
                                            setVideos([])
                                            setMainImage("")
                                        }}
                                    >
                                        Reset
                                    </Button>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                            type="submit"
                                            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <div className="flex items-center">
                                                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                    Saving...
                                                </div>
                                            ) : (
                                                "Add Cat"
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
