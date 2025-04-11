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
import { Save, Loader2 } from "lucide-react"
import type { SeoSettings, FirebaseSettings } from "@/lib/firebase/settingsService"

// Change the interface to remove generalSettings and related props
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

// Update the function parameters to match the new interface
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

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Settings</h2>

            <Tabs defaultValue="seo" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="seo">SEO</TabsTrigger>
                    <TabsTrigger value="firebase">Firebase</TabsTrigger>
                </TabsList>

                <TabsContent value="seo" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>SEO Settings</CardTitle>
                            <CardDescription>Optimize your site for search engines</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="metaTitle">Meta Title</Label>
                                <Input
                                    id="metaTitle"
                                    value={seoSettings.metaTitle}
                                    onChange={(e) => onSeoSettingsChange({ ...seoSettings, metaTitle: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">Recommended length: 50-60 characters</p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="metaDescription">Meta Description</Label>
                                <Textarea
                                    id="metaDescription"
                                    value={seoSettings.metaDescription}
                                    onChange={(e) => onSeoSettingsChange({ ...seoSettings, metaDescription: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">Recommended length: 150-160 characters</p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="ogImage">Open Graph Image URL</Label>
                                <Input
                                    id="ogImage"
                                    value={seoSettings.ogImage}
                                    onChange={(e) => onSeoSettingsChange({ ...seoSettings, ogImage: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    This image will be displayed when your site is shared on social media
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                                <Input
                                    id="googleAnalyticsId"
                                    placeholder="G-XXXXXXXXXX"
                                    value={seoSettings.googleAnalyticsId}
                                    onChange={(e) => onSeoSettingsChange({ ...seoSettings, googleAnalyticsId: e.target.value })}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={onSaveSeo} disabled={savingSeo}>
                                {savingSeo ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save SEO Settings
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="firebase" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Firebase Settings</CardTitle>
                            <CardDescription>Configure your Firebase integration</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="imageQuality">Image Quality</Label>
                                <Select
                                    value={firebaseSettings.imageQuality}
                                    onValueChange={(value) =>
                                        onFirebaseSettingsChange({
                                            ...firebaseSettings,
                                            imageQuality: value as "low" | "medium" | "high",
                                        })
                                    }
                                >
                                    <SelectTrigger id="imageQuality">
                                        <SelectValue placeholder="Select image quality" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low (faster loading)</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High (better quality)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="maxImageSize">Max Image Size (MB)</Label>
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
                                />
                                <p className="text-xs text-muted-foreground">Maximum size for image uploads (1-50MB)</p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="maxVideoSize">Max Video Size (MB)</Label>
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
                                />
                                <p className="text-xs text-muted-foreground">Maximum size for video uploads (1-200MB)</p>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="enableImageCompression"
                                    checked={firebaseSettings.enableImageCompression}
                                    onCheckedChange={(checked) =>
                                        onFirebaseSettingsChange({ ...firebaseSettings, enableImageCompression: checked })
                                    }
                                />
                                <Label htmlFor="enableImageCompression">Enable Image Compression</Label>
                            </div>

                            {/* Removed video compression toggle */}
                        </CardContent>
                        <CardFooter>
                            <Button onClick={onSaveFirebase} disabled={savingFirebase}>
                                {savingFirebase ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Firebase Settings
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
