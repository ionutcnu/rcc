"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { getCatById, updateCat, getAllCats } from "@/lib/firebase/catService"
import { uploadCatImage, uploadCatVideo } from "@/lib/firebase/storageService"
import { useCatPopup } from "@/components/CatPopupProvider"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Upload, Loader2, X, Plus, Film } from "lucide-react"
import type { CatProfile } from "@/lib/types/cat"
import { ComboboxSelect } from "@/components/ui/combobox-select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// Form schema for edit cat
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
    motherId: z.string().optional(),
    fatherId: z.string().optional(),
    availability: z.string().min(1, "Availability status is required"),
})

type FormValues = z.infer<typeof formSchema>

async function uploadBase64Image(base64String: string, folder: string): Promise<string> {
    try {
        // Extract file type and create a proper filename
        const mimeType = base64String.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,/)![1]
        const fileExt = mimeType.split("/")[1]

        // Convert base64 to blob directly without using fetch
        // This avoids the "Failed to fetch" error
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
        const file = new File([blob], `image-${Date.now()}.${fileExt}`, { type: mimeType })

        // Upload to Firebase Storage
        // Assuming you have a function to handle file uploads and get the URL
        // Replace this with your actual upload function
        // For example:
        // const uploadResult = await uploadBytes(storageRef, file);
        // const downloadURL = await getDownloadURL(uploadResult.ref);
        // return downloadURL;
        async function uploadFileAndGetURL(file: File, folder: string): Promise<string> {
            // Placeholder implementation - replace with your actual Firebase Storage upload logic
            console.log(`Simulating upload of ${file.name} to ${folder}`)
            return `https://example.com/images/${file.name}` // Replace with actual URL
        }
        return await uploadFileAndGetURL(file, folder)
    } catch (error) {
        console.error("Error uploading image:", error)
        throw error
    }
}

async function uploadBase64Video(base64String: string, folder: string): Promise<string> {
    try {
        // Extract file type and create a proper filename
        const mimeType = base64String.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,/)![1]
        const fileExt = mimeType.split("/")[1]

        // Convert base64 to blob directly without using fetch
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
        const file = new File([blob], `video-${Date.now()}.${fileExt}`, { type: mimeType })

        async function uploadFileAndGetURL(file: File, folder: string): Promise<string> {
            // Placeholder implementation - replace with your actual Firebase Storage upload logic
            console.log(`Simulating upload of ${file.name} to ${folder}`)
            return `https://example.com/videos/${file.name}` // Replace with actual URL
        }

        return await uploadFileAndGetURL(file, folder)
    } catch (error) {
        console.error("Error uploading video:", error)
        throw error
    }
}

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
    const [allCats, setAllCats] = useState<CatProfile[]>([])
    const [isLoadingCats, setIsLoadingCats] = useState(true)

    // Video states
    const [videoFiles, setVideoFiles] = useState<File[]>([])
    const [existingVideos, setExistingVideos] = useState<string[]>([])

    // Form setup with default values
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            color: "",
            gender: "male",
            yearOfBirth: new Date().getFullYear(),
            isVaccinated: false,
            isMicrochipped: false,
            isCastrated: false,
            breed: "",
            category: "",
            motherId: "",
            fatherId: "",
            availability: "available",
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
                        gender: cat.gender || "male",
                        yearOfBirth: cat.yearOfBirth || new Date().getFullYear(),
                        isVaccinated: cat.isVaccinated || false,
                        isMicrochipped: cat.isMicrochipped || false,
                        isCastrated: cat.isCastrated || false,
                        breed: cat.breed || "",
                        category: cat.category || "",
                        motherId: cat.motherId || "",
                        fatherId: cat.fatherId || "",
                        availability: cat.availability || "available",
                    })

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
    }, [catId, router, showPopup, form])

    useEffect(() => {
        const fetchAllCats = async () => {
            try {
                setIsLoadingCats(true)
                const fetchedCats = await getAllCats()
                console.log("Fetched cats for edit form:", fetchedCats)
                setAllCats(fetchedCats)
            } catch (error) {
                console.error("Error fetching all cats:", error)
                showPopup("Error loading cat data for parent selection")
            } finally {
                setIsLoadingCats(false)
            }
        }

        fetchAllCats()
    }, [showPopup])

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

    const onSubmit = async (data: FormValues) => {
        try {
            setIsSubmitting(true)

            // Upload main image if changed
            let mainImageUrl = mainImagePreview
            if (mainImageFile) {
                mainImageUrl = await uploadCatImage(mainImageFile, catId, "main")
            }

            // Upload additional images if any
            let imageUrls = [...existingImages]
            if (additionalImageFiles.length > 0) {
                const newImageUrls = await Promise.all(
                    additionalImageFiles.map((file, index) => uploadCatImage(file, catId, `additional_${index}`)),
                )
                imageUrls = [...imageUrls, ...newImageUrls]
            }

            // Upload videos if any
            let videoUrls = [...existingVideos]
            if (videoFiles.length > 0) {
                const newVideoUrls = await Promise.all(
                    videoFiles.map((file, index) => uploadCatVideo(file, catId, `video_${index}`)),
                )
                videoUrls = [...videoUrls, ...newVideoUrls]
            }

            // Update the cat in Firestore
            await updateCat(catId, {
                ...data,
                mainImage: mainImageUrl || "",
                images: imageUrls,
                videos: videoUrls,
                motherId: data.motherId === "" ? null : data.motherId,
                fatherId: data.fatherId === "" ? null : data.fatherId,
            })

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
                <h1 className="text-3xl font-bold">Edit Cat: {form.getValues("name")}</h1>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Cat Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Cat name" {...field} />
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
                                                <FormLabel>Breed *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Persian" {...field} />
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
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select gender" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="male">Male</SelectItem>
                                                        <SelectItem value="female">Female</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

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
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select category" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="kitten">Kitten</SelectItem>
                                                        <SelectItem value="adult">Adult</SelectItem>
                                                        <SelectItem value="senior">Senior</SelectItem>
                                                        <SelectItem value="breeding">Breeding</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="availability"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Availability</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
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

                                    <FormField
                                        control={form.control}
                                        name="motherId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Mother Cat</FormLabel>
                                                <FormControl>
                                                    <ComboboxSelect
                                                        options={motherOptions}
                                                        value={field.value || ""}
                                                        onValueChange={(value) => {
                                                            console.log("Mother selected:", value)
                                                            field.onChange(value)
                                                        }}
                                                        placeholder="Select mother cat"
                                                        searchPlaceholder="Search cats..."
                                                        emptyMessage={isLoadingCats ? "Loading cats..." : "No female cats found."}
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
                                                <FormLabel>Father Cat</FormLabel>
                                                <FormControl>
                                                    <ComboboxSelect
                                                        options={fatherOptions}
                                                        value={field.value || ""}
                                                        onValueChange={(value) => {
                                                            console.log("Father selected:", value)
                                                            field.onChange(value)
                                                        }}
                                                        placeholder="Select father cat"
                                                        searchPlaceholder="Search cats..."
                                                        emptyMessage={isLoadingCats ? "Loading cats..." : "No male cats found."}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea rows={5} placeholder="Describe the cat..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

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
            </Form>
        </div>
    )
}
