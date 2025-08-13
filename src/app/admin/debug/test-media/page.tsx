"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, CheckCircle, ImageIcon, Upload, Video, RefreshCw, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function TestMediaUploadPage() {
  const [catId, setCatId] = useState("")
  const [isMainImage, setIsMainImage] = useState(false)
  const [uploadType, setUploadType] = useState<"image" | "video">("image")
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusCode, setStatusCode] = useState<number | null>(null)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sanitizePreviewUrl = (url: string | null): string => {
    if (!url) return "/placeholder.svg"
    
    // Only allow blob URLs (created by URL.createObjectURL) and placeholder
    if (url.startsWith("blob:") || url === "/placeholder.svg") {
      return url
    }
    
    // Return safe fallback for any other URLs
    return "/placeholder.svg"
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Create a preview URL for the selected file
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleUpload = async () => {
    if (!catId) {
      setError("Cat ID is required")
      return
    }

    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError("Please select a file to upload")
      return
    }

    setLoading(true)
    setError(null)
    setResponse(null)
    setStatusCode(null)
    setResponseTime(null)

    try {
      const startTime = performance.now()

      // Create form data
      const formData = new FormData()
      formData.append("file", file)
      formData.append("catId", catId)
      formData.append("type", uploadType)

      if (uploadType === "image") {
        formData.append("isMainImage", isMainImage.toString())
      }

      // Send the request
      const endpoint = uploadType === "image" ? "/api/cats/upload/image" : "/api/cats/upload/video"

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
        credentials: "include", // Include cookies for authentication
      })

      const endTime = performance.now()
      const responseTimeValue = Math.round(endTime - startTime)

      setResponseTime(responseTimeValue)
      setStatusCode(res.status)

      // Parse the response
      const data = await res.json()
      setResponse(data)
    } catch (err: any) {
      const errorMessage = err.message || "An error occurred"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const formatJson = (json: any) => {
    try {
      // Special handling for long URLs
      const jsonString = JSON.stringify(
        json,
        (key, value) => {
          // If the value is a string that looks like a URL and is longer than 60 characters
          if (
            typeof value === "string" &&
            (value.startsWith("http://") || value.startsWith("https://")) &&
            value.length > 60
          ) {
            // Add invisible zero-width spaces after slashes and dots to allow breaking
            return value.replace(/([/.])/g, "$1\u200B")
          }
          return value
        },
        2,
      )
      return jsonString
    } catch (e) {
      return "Invalid JSON"
    }
  }

  const getStatusBadge = () => {
    if (statusCode === null) return null

    if (statusCode >= 200 && statusCode < 300) {
      return <Badge className="bg-green-500 hover:bg-green-600">{statusCode} Success</Badge>
    } else if (statusCode >= 400 && statusCode < 500) {
      return <Badge className="bg-amber-500 hover:bg-amber-600">{statusCode} Client Error</Badge>
    } else if (statusCode >= 500) {
      return <Badge className="bg-red-500 hover:bg-red-600">{statusCode} Server Error</Badge>
    } else {
      return <Badge>{statusCode}</Badge>
    }
  }

  // Determine if request was successful based on status code
  const isRequestSuccessful = statusCode !== null && statusCode >= 200 && statusCode < 300

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Media Upload Tester</h1>
          <p className="text-gray-500">Test uploading images and videos for cats</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Media</CardTitle>
            <CardDescription>Configure and upload media files for cats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="image" onValueChange={(value) => setUploadType(value as "image" | "video")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="image" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Image
                </TabsTrigger>
                <TabsTrigger value="video" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Video
                </TabsTrigger>
              </TabsList>

              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="catId">Cat ID</Label>
                  <Input
                    id="catId"
                    placeholder="Enter the cat ID"
                    value={catId}
                    onChange={(e) => setCatId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Select {uploadType}</Label>
                  <Input
                    id="file"
                    type="file"
                    ref={fileInputRef}
                    accept={uploadType === "image" ? "image/*" : "video/*"}
                    onChange={handleFileChange}
                  />
                </div>

                {uploadType === "image" && (
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="isMainImage"
                      checked={isMainImage}
                      onCheckedChange={(checked) => setIsMainImage(checked === true)}
                    />
                    <Label htmlFor="isMainImage" className="cursor-pointer">
                      Set as main image
                    </Label>
                  </div>
                )}

                {previewUrl && (
                  <div className="mt-4">
                    <Label>Preview</Label>
                    <div className="mt-2 border rounded-md p-2 flex justify-center">
                      {uploadType === "image" ? (
                        <img src={sanitizePreviewUrl(previewUrl)} alt="Preview" className="max-h-64 object-contain" />
                      ) : (
                        <video src={sanitizePreviewUrl(previewUrl)} controls className="max-h-64 w-full" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button onClick={handleUpload} className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {uploadType}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Response</CardTitle>
                <CardDescription>API response details</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge()}
                {responseTime !== null && <Badge variant="outline">{responseTime}ms</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error</h3>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            ) : response ? (
              <div className="space-y-4">
                <ScrollArea className="h-[400px] w-full rounded-md border p-4 font-mono text-sm">
                  <pre className="whitespace-pre-wrap break-words overflow-x-auto">{formatJson(response)}</pre>
                </ScrollArea>
                <div className="flex items-center space-x-2">
                  {isRequestSuccessful ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm">
                    {isRequestSuccessful ? "Upload successful" : "Upload failed"}
                    {response.message && `: ${response.message}`}
                  </span>
                </div>
                {response.imageUrl && (
                  <div className="mt-4 p-4 border rounded-md">
                    <h3 className="text-sm font-medium mb-2">Uploaded Image</h3>
                    <img
                      src={response.imageUrl || "/placeholder.svg"}
                      alt="Uploaded"
                      className="max-h-64 object-contain mx-auto"
                    />
                    <p className="mt-2 text-xs text-gray-500 break-all">{response.imageUrl}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500 space-y-2">
                <Upload className="h-8 w-8" />
                <p>Upload a file to see the response</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
            <CardDescription>Instructions for testing media uploads</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2">
              <li>Enter the ID of an existing cat</li>
              <li>Select the type of media you want to upload (image or video)</li>
              <li>Choose a file from your computer</li>
              <li>For images, you can optionally set it as the main image</li>
              <li>Click the "Upload" button to send the file to the server</li>
              <li>View the response on the right panel</li>
            </ol>

            <Separator className="my-4" />

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Important Notes</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>The cat ID must be for an existing cat in the database</li>
                <li>Images should be in JPG, PNG, or WebP format</li>
                <li>Videos should be in MP4 format</li>
                <li>The API uses FormData to upload files, not JSON</li>
                <li>You must be logged in as an admin to upload media</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
