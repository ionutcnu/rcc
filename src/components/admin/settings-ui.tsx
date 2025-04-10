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
import type { GeneralSettings, SeoSettings, FirebaseSettings } from "@/lib/firebase/settingsService"

interface SettingsUiProps {
    generalSettings: GeneralSettings
    seoSettings: SeoSettings
    firebaseSettings: FirebaseSettings
    onGeneralSettingsChange: (settings: GeneralSettings) => void
    onSeoSettingsChange: (settings: SeoSettings) => void
    onFirebaseSettingsChange: (settings: FirebaseSettings) => void
    onSaveGeneral: () => void
    onSaveSeo: () => void
    onSaveFirebase: () => void
    savingGeneral: boolean
    savingSeo: boolean
    savingFirebase: boolean
}

export function SettingsUi({
                               generalSettings,
                               seoSettings,
                               firebaseSettings,
                               onGeneralSettingsChange,
                               onSeoSettingsChange,
                               onFirebaseSettingsChange,
                               onSaveGeneral,
                               onSaveSeo,
                               onSaveFirebase,
                               savingGeneral,
                               savingSeo,
                               savingFirebase,
                           }: SettingsUiProps) {
    const [activeTab, setActiveTab] = useState("general")

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Settings</h2>

            <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="seo">SEO</TabsTrigger>
                    <TabsTrigger value="firebase">Firebase</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Site Settings</CardTitle>
                            <CardDescription>Manage your website's general settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="siteName">Site Name</Label>
                                <Input
                                    id="siteName"
                                    value={generalSettings.siteName}
                                    onChange={(e) => onGeneralSettingsChange({ ...generalSettings, siteName: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="siteDescription">Site Description</Label>
                                <Textarea
                                    id="siteDescription"
                                    value={generalSettings.siteDescription}
                                    onChange={(e) => onGeneralSettingsChange({ ...generalSettings, siteDescription: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="contactEmail">Contact Email</Label>
                                <Input
                                    id="contactEmail"
                                    type="email"
                                    value={generalSettings.contactEmail}
                                    onChange={(e) => onGeneralSettingsChange({ ...generalSettings, contactEmail: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="itemsPerPage">Items Per Page</Label>
                                <Select
                                    value={generalSettings.itemsPerPage.toString()}
                                    onValueChange={(value) =>
                                        onGeneralSettingsChange({ ...generalSettings, itemsPerPage: Number(value) })
                                    }
                                >
                                    <SelectTrigger id="itemsPerPage">
                                        <SelectValue placeholder="Select items per page" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="8">8</SelectItem>
                                        <SelectItem value="12">12</SelectItem>
                                        <SelectItem value="16">16</SelectItem>
                                        <SelectItem value="24">24</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="enableComments"
                                    checked={generalSettings.enableComments}
                                    onCheckedChange={(checked) =>
                                        onGeneralSettingsChange({ ...generalSettings, enableComments: checked })
                                    }
                                />
                                <Label htmlFor="enableComments">Enable Comments</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="enableLikes"
                                    checked={generalSettings.enableLikes}
                                    onCheckedChange={(checked) => onGeneralSettingsChange({ ...generalSettings, enableLikes: checked })}
                                />
                                <Label htmlFor="enableLikes">Enable Likes</Label>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={onSaveGeneral} disabled={savingGeneral}>
                                {savingGeneral ? (
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
                </TabsContent>

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
