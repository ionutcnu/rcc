"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Loader2, Info } from "lucide-react"
import type { SeoSettings, FirebaseSettings } from "@/lib/firebase/settingsService"
import { getProxiedImageUrl } from "@/lib/utils/image-utils"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-mobile"

interface SettingsUiProps {
    seoSettings: SeoSettings
    firebaseSettings: FirebaseSettings
    onSeoSettingsChange: (settings: SeoSettings) => void
    onFirebaseSettingsChange: (settings: FirebaseSettings) => void
    onSaveSeo: () => void
    onSaveFirebase: () => void
    savingSeo: boolean
    savingFirebase: boolean
}

export function SettingsUi({
                               seoSettings,
                               firebaseSettings,
                               onSeoSettingsChange,
                               onFirebaseSettingsChange,
                               onSaveSeo,
                               onSaveFirebase,
                               savingSeo,
                               savingFirebase,
                           }: SettingsUiProps) {
    const [activeTab, setActiveTab] = useState("seo")
    const isMobile = useMediaQuery("(max-width: 768px)")

    // Calculate character counts for SEO fields
    const titleLength = seoSettings.metaTitle?.length || 0
    const descriptionLength = seoSettings.metaDescription?.length || 0

    // Determine character limit status
    const getTitleStatus = () => {
        if (titleLength === 0) return "neutral"
        if (titleLength < 30) return "warning"
        if (titleLength <= 60) return "success"
        return "error"
    }

    const getDescriptionStatus = () => {
        if (descriptionLength === 0) return "neutral"
        if (descriptionLength < 120) return "warning"
        if (descriptionLength <= 160) return "success"
        return "error"
    }

    const titleStatus = getTitleStatus()
    const descriptionStatus = getDescriptionStatus()

    return (
        <TooltipProvider>
            <div className="space-y-8 max-w-4xl mx-auto pb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                    <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-pink-600 text-transparent bg-clip-text">
                            Settings
                        </h2>
                        <p className="text-muted-foreground mt-1">Configure your site settings and preferences</p>
                    </div>
                </div>

                <Tabs defaultValue="seo" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-2 w-full max-w-md mb-6">
                        <TabsTrigger value="seo" className="text-sm md:text-base">
                            SEO & Analytics
                        </TabsTrigger>
                        <TabsTrigger value="firebase" className="text-sm md:text-base">
                            Media & Storage
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="seo" className="space-y-6 animate-in fade-in-50 duration-300">
                        <Card className="border-t-4 border-t-orange-500 shadow-md">
                            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/10">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-2xl">SEO Settings</CardTitle>
                                        <CardDescription className="mt-1.5">
                                            Optimize your site for search engines and social media sharing
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6 pt-6">
                                <div className="grid gap-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <Label htmlFor="metaTitle" className="text-base font-medium">
                                            Meta Title
                                        </Label>
                                        <Badge
                                            variant={
                                                titleStatus === "success"
                                                    ? "success"
                                                    : titleStatus === "warning"
                                                        ? "warning"
                                                        : titleStatus === "error"
                                                            ? "destructive"
                                                            : "outline"
                                            }
                                            className="h-6"
                                        >
                                            {titleLength}/60 characters
                                        </Badge>
                                    </div>
                                    <Input
                                        id="metaTitle"
                                        value={seoSettings.metaTitle || ""}
                                        onChange={(e) => onSeoSettingsChange({ ...seoSettings, metaTitle: e.target.value })}
                                        placeholder="Cat Showcase - Beautiful Cats for Adoption"
                                        className={cn(
                                            "h-11 text-base",
                                            titleStatus === "error" && "border-red-500 focus-visible:ring-red-500",
                                        )}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Recommended: 50-60 characters. This appears in search engine results.
                                    </p>
                                </div>

                                <div className="grid gap-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <Label htmlFor="metaDescription" className="text-base font-medium">
                                            Meta Description
                                        </Label>
                                        <Badge
                                            variant={
                                                descriptionStatus === "success"
                                                    ? "success"
                                                    : descriptionStatus === "warning"
                                                        ? "warning"
                                                        : descriptionStatus === "error"
                                                            ? "destructive"
                                                            : "outline"
                                            }
                                            className="h-6"
                                        >
                                            {descriptionLength}/160 characters
                                        </Badge>
                                    </div>
                                    <Textarea
                                        id="metaDescription"
                                        value={seoSettings.metaDescription || ""}
                                        onChange={(e) => onSeoSettingsChange({ ...seoSettings, metaDescription: e.target.value })}
                                        placeholder="Discover beautiful cats available for adoption. Browse our showcase of cats with detailed profiles and high-quality images."
                                        className={cn(
                                            "min-h-[100px] text-base",
                                            descriptionStatus === "error" && "border-red-500 focus-visible:ring-red-500",
                                        )}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Recommended: 150-160 characters. A good description improves click-through rates from search
                                        results.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="ogImage" className="text-base font-medium flex items-center gap-2">
                                            Social Media Image
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    This image will be displayed when your site is shared on social media platforms like Facebook,
                                                    Twitter, and LinkedIn.
                                                </TooltipContent>
                                            </Tooltip>
                                        </Label>
                                    </div>
                                    <Input
                                        id="ogImage"
                                        value={seoSettings.ogImage || ""}
                                        onChange={(e) => onSeoSettingsChange({ ...seoSettings, ogImage: e.target.value })}
                                        placeholder="https://example.com/images/og-image.jpg"
                                        className="h-11 text-base"
                                    />
                                    <p className="text-xs text-muted-foreground">Recommended size: 1200×630 pixels (ratio 1.91:1)</p>
                                </div>

                                {seoSettings.ogImage && (
                                    <div className="mt-2 p-4 rounded-lg bg-muted/50 border">
                                        <p className="text-sm font-medium mb-2">Social Media Preview:</p>
                                        <div className="border rounded-md overflow-hidden bg-background shadow-sm">
                                            <img
                                                src={getProxiedImageUrl(seoSettings.ogImage) || "/placeholder.svg"}
                                                alt="Open Graph preview"
                                                className="w-full h-[200px] object-cover object-center"
                                                onError={(e) => {
                                                    ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=300"
                                                }}
                                            />
                                            <div className="p-3">
                                                <h3 className="font-semibold text-sm line-clamp-1">
                                                    {seoSettings.metaTitle || "Website Title"}
                                                </h3>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                    {seoSettings.metaDescription || "Website description"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid gap-3">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="googleAnalyticsId" className="text-base font-medium flex items-center gap-2">
                                            Google Analytics ID
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    Your Google Analytics 4 measurement ID starts with "G-" and can be found in your Google
                                                    Analytics account.
                                                </TooltipContent>
                                            </Tooltip>
                                        </Label>
                                    </div>
                                    <Input
                                        id="googleAnalyticsId"
                                        placeholder="G-XXXXXXXXXX"
                                        value={seoSettings.googleAnalyticsId || ""}
                                        onChange={(e) => onSeoSettingsChange({ ...seoSettings, googleAnalyticsId: e.target.value })}
                                        className="h-11 text-base"
                                    />
                                    <p className="text-xs text-muted-foreground">Used to track website traffic and user behavior.</p>
                                </div>
                            </CardContent>

                            <CardFooter className="flex justify-end border-t bg-muted/20 py-4">
                                <Button
                                    onClick={onSaveSeo}
                                    disabled={savingSeo}
                                    size="lg"
                                    className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-md"
                                >
                                    {savingSeo ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-5 w-5" />
                                            Save SEO Settings
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="firebase" className="space-y-6 animate-in fade-in-50 duration-300">
                        <Card className="border-t-4 border-t-pink-500 shadow-md">
                            <CardHeader className="bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-950/20 dark:to-pink-900/10">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-2xl">Media Settings</CardTitle>
                                        <CardDescription className="mt-1.5">
                                            Configure storage limits and image quality settings
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6 pt-6">
                                <div className="grid gap-3">
                                    <Label htmlFor="imageQuality" className="text-base font-medium flex items-center gap-2">
                                        Image Quality
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                The Image Quality setting is now active. When "Enable Image Compression" is checked, images will
                                                be compressed according to the quality setting:
                                                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                                    <li>Low: 60% quality (smallest file size)</li>
                                                    <li>Medium: 80% quality (balanced)</li>
                                                    <li>High: 90% quality (best appearance)</li>
                                                </ul>
                                                This will help save storage space in Firebase.
                                            </TooltipContent>
                                        </Tooltip>
                                    </Label>
                                    <Select
                                        value={firebaseSettings.imageQuality}
                                        onValueChange={(value) =>
                                            onFirebaseSettingsChange({
                                                ...firebaseSettings,
                                                imageQuality: value as "low" | "medium" | "high",
                                            })
                                        }
                                    >
                                        <SelectTrigger id="imageQuality" className="h-11 text-base">
                                            <SelectValue placeholder="Select image quality" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low (60% - saves storage)</SelectItem>
                                            <SelectItem value="medium">Medium (80% - balanced)</SelectItem>
                                            <SelectItem value="high">High (90% - best appearance)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Higher quality means better looking images but larger file sizes.
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label htmlFor="maxImageSize" className="text-base font-medium flex items-center gap-2">
                                            Max Image Size (MB)
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent>Maximum allowed file size for uploaded images</TooltipContent>
                                            </Tooltip>
                                        </Label>
                                        <Input
                                            id="maxImageSize"
                                            type="number"
                                            min={1}
                                            max={50}
                                            value={firebaseSettings.maxImageSize}
                                            onChange={(e) =>
                                                onFirebaseSettingsChange({
                                                    ...firebaseSettings,
                                                    maxImageSize: Number(e.target.value),
                                                })
                                            }
                                            className="h-11 text-base"
                                        />
                                        <p className="text-xs text-muted-foreground">Limit: 1-50 MB per image</p>
                                    </div>

                                    <div className="space-y-3">
                                        <Label htmlFor="maxVideoSize" className="text-base font-medium flex items-center gap-2">
                                            Max Video Size (MB)
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent>Maximum allowed file size for uploaded videos</TooltipContent>
                                            </Tooltip>
                                        </Label>
                                        <Input
                                            id="maxVideoSize"
                                            type="number"
                                            min={1}
                                            max={200}
                                            value={firebaseSettings.maxVideoSize}
                                            onChange={(e) =>
                                                onFirebaseSettingsChange({
                                                    ...firebaseSettings,
                                                    maxVideoSize: Number(e.target.value),
                                                })
                                            }
                                            className="h-11 text-base"
                                        />
                                        <p className="text-xs text-muted-foreground">Limit: 1-200 MB per video</p>
                                    </div>
                                </div>

                                <div className="flex flex-col space-y-2 pt-2">
                                    <div className="flex items-center justify-between space-x-2 rounded-lg border p-4 shadow-sm">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="enableImageCompression" className="text-base font-medium flex items-center gap-2">
                                                Enable Image Compression
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs">
                                                        When enabled, images will be compressed according to the selected quality setting:
                                                        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                                            <li>Low: 60% quality (smallest file size)</li>
                                                            <li>Medium: 80% quality (balanced)</li>
                                                            <li>High: 90% quality (best appearance)</li>
                                                        </ul>
                                                        This will help save storage space in Firebase.
                                                    </TooltipContent>
                                                </Tooltip>
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                Automatically compress images to save storage space
                                            </p>
                                        </div>
                                        <Switch
                                            id="enableImageCompression"
                                            checked={firebaseSettings.enableImageCompression}
                                            onCheckedChange={(checked) =>
                                                onFirebaseSettingsChange({ ...firebaseSettings, enableImageCompression: checked })
                                            }
                                        />
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="flex justify-end border-t bg-muted/20 py-4">
                                <Button
                                    onClick={onSaveFirebase}
                                    disabled={savingFirebase}
                                    size="lg"
                                    className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white shadow-md"
                                >
                                    {savingFirebase ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-5 w-5" />
                                            Save Media Settings
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </TooltipProvider>
    )
}
