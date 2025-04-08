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

export function Settings() {
  const [siteSettings, setSiteSettings] = useState({
    siteName: "Cat Showcase",
    siteDescription: "A showcase of beautiful cats available for adoption.",
    contactEmail: "contact@catshowcase.com",
    enableComments: true,
    enableLikes: true,
    itemsPerPage: "12",
  })

  const handleSave = () => {
    // In a real implementation, this would save to Firebase
    alert("Settings saved successfully!")
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      <Tabs defaultValue="general">
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
                  value={siteSettings.siteName}
                  onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={siteSettings.siteDescription}
                  onChange={(e) => setSiteSettings({ ...siteSettings, siteDescription: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={siteSettings.contactEmail}
                  onChange={(e) => setSiteSettings({ ...siteSettings, contactEmail: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="itemsPerPage">Items Per Page</Label>
                <Select
                  value={siteSettings.itemsPerPage}
                  onValueChange={(value) => setSiteSettings({ ...siteSettings, itemsPerPage: value })}
                >
                  <SelectTrigger>
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
                  checked={siteSettings.enableComments}
                  onCheckedChange={(checked) => setSiteSettings({ ...siteSettings, enableComments: checked })}
                />
                <Label htmlFor="enableComments">Enable Comments</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enableLikes"
                  checked={siteSettings.enableLikes}
                  onCheckedChange={(checked) => setSiteSettings({ ...siteSettings, enableLikes: checked })}
                />
                <Label htmlFor="enableLikes">Enable Likes</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave}>Save Changes</Button>
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
                <Input id="metaTitle" placeholder="Cat Showcase - Beautiful Cats for Adoption" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  placeholder="Discover beautiful cats available for adoption. Browse our showcase of cats with detailed profiles and high-quality images."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ogImage">Open Graph Image URL</Label>
                <Input id="ogImage" placeholder="https://yourdomain.com/images/og-image.jpg" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                <Input id="googleAnalyticsId" placeholder="G-XXXXXXXXXX" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save SEO Settings</Button>
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
                <Label htmlFor="storagePrefix">Storage Prefix</Label>
                <Input id="storagePrefix" placeholder="cats/" />
                <p className="text-sm text-muted-foreground">
                  This prefix will be added to all uploaded files in Firebase Storage
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="imageQuality">Image Quality</Label>
                <Select defaultValue="high">
                  <SelectTrigger>
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
                <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                <Input id="maxFileSize" type="number" placeholder="5" />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="enableImageCompression" defaultChecked />
                <Label htmlFor="enableImageCompression">Enable Image Compression</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="enableVideoCompression" defaultChecked />
                <Label htmlFor="enableVideoCompression">Enable Video Compression</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Firebase Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
