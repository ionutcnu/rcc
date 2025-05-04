"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Code,
  Database,
  Play,
  RefreshCw,
  XCircle,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Define the API endpoint types
type ApiEndpoint = {
  value: string
  label: string
  method: string
  description: string
  paramStructure?: string
  paramPlaceholder?: string
  defaultBody?: string
  category: string
}

// Define parameter structure type
type ParamField = {
  name: string
  placeholder: string
  required: boolean
}

// Add a new RequestHistoryItem type after the existing type definitions
type RequestHistoryItem = {
  id: string
  endpoint: string
  method: string
  queryParams: string
  requestBody: string
  timestamp: Date
  statusCode: number | null
  responseTime: number | null
  label: string
  response: any // Store the response data
  error: string | null // Store any error message
}

export default function CatApiTesterPage() {
  const [endpoint, setEndpoint] = useState("/api/cats")
  const [method, setMethod] = useState("GET")
  const [requestBody, setRequestBody] = useState("")
  const [queryParams, setQueryParams] = useState("")
  const [paramFields, setParamFields] = useState<ParamField[]>([])
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusCode, setStatusCode] = useState<number | null>(null)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedEndpointLabel, setSelectedEndpointLabel] = useState<string>("")
  // Add this to the state declarations at the top of the component
  const [requestHistory, setRequestHistory] = useState<RequestHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [expandedHistoryItem, setExpandedHistoryItem] = useState<string | null>(null)

  // Sample cat data for realistic testing
  const sampleCatData = {
    name: "New Test Cat",
    breed: "British Shorthair",
    color: "black",
    gender: "Male",
    category: "Domestic",
    description: "A lovely test cat with detailed information",
    yearOfBirth: 2023,
    availability: "Available",
    isVaccinated: true,
    isCastrated: true,
    isMicrochipped: true,
    mainImage:
      "https://firebasestorage.googleapis.com/v0/b/redcatcuasar.firebasestorage.app/o/cats%2Fimages%2Fsample-image.jpeg?alt=media&token=sample-token",
    images: [
      "https://firebasestorage.googleapis.com/v0/b/redcatcuasar.firebasestorage.app/o/cats%2Fsample-id%2Fimages%2Fsample-image-1.jpg?alt=media&token=sample-token-1",
    ],
    videos: [
      "https://firebasestorage.googleapis.com/v0/b/redcatcuasar.firebasestorage.app/o/cats%2Fsample-id%2Fvideos%2Fsample-video-1.mp4?alt=media&token=sample-token-2",
    ],
    fatherId: "",
    motherId: "",
  }

  // Enhanced API endpoints with categories, descriptions and parameter structures
  const apiEndpoints: ApiEndpoint[] = [
    {
      value: "/api/cats",
      label: "Get All Cats",
      method: "GET",
      description: "Fetches all active cats",
      category: "cats",
    },
    {
      value: "/api/cats",
      label: "Get Cat by ID",
      method: "GET",
      description: "Fetches a specific cat by ID",
      paramStructure: "id",
      paramPlaceholder: "Paste cat ID here",
      category: "cats",
    },
    {
      value: "/api/cats/by-name",
      label: "Get Cat by Name",
      method: "GET",
      description: "Fetches a cat by its name",
      paramStructure: "name",
      paramPlaceholder: "Enter cat name",
      category: "cats",
    },
    {
      value: "/api/cats/add",
      label: "Add Cat",
      method: "POST",
      description: "Creates a new cat profile",
      defaultBody: JSON.stringify(sampleCatData, null, 2),
      category: "cats",
    },
    {
      value: "/api/cats/update",
      label: "Update Cat",
      method: "PUT",
      description: "Updates an existing cat profile",
      defaultBody: JSON.stringify(
        {
          id: "PASTE_CAT_ID_HERE",
          name: "Updated Cat Name",
          breed: "British Shorthair",
          color: "gray",
          gender: "Female",
          category: "Domestic",
          description: "Updated description for this cat",
          yearOfBirth: 2022,
          availability: "Reserved",
          isVaccinated: true,
          isCastrated: true,
          isMicrochipped: true,
          mainImage:
            "https://firebasestorage.googleapis.com/v0/b/redcatcuasar.firebasestorage.app/o/cats%2Fimages%2Fupdated-image.jpeg?alt=media&token=sample-token",
          images: [
            "https://firebasestorage.googleapis.com/v0/b/redcatcuasar.firebasestorage.app/o/cats%2Fsample-id%2Fimages%2Fupdated-image-1.jpg?alt=media&token=sample-token-1",
          ],
          videos: [
            "https://firebasestorage.googleapis.com/v0/b/redcatcuasar.firebasestorage.app/o/cats%2Fsample-id%2Fvideos%2Fupdated-video-1.mp4?alt=media&token=sample-token-2",
          ],
          fatherId: "PASTE_FATHER_ID_HERE",
          motherId: "PASTE_MOTHER_ID_HERE",
        },
        null,
        2,
      ),
      category: "cats",
    },
    {
      value: "/api/cats/delete",
      label: "Delete Cat",
      method: "DELETE",
      description: "Soft or permanently deletes a cat",
      paramStructure: "id,permanent",
      paramPlaceholder: "Paste cat ID here,true or false",
      category: "cats",
    },
    {
      value: "/api/cats/restore",
      label: "Restore Cat",
      method: "POST",
      description: "Restores a soft-deleted cat",
      defaultBody: JSON.stringify(
        {
          id: "PASTE_CAT_ID_HERE",
        },
        null,
        2,
      ),
      category: "cats",
    },
    {
      value: "/api/cats/trash",
      label: "Get Trashed Cats",
      method: "GET",
      description: "Fetches all soft-deleted cats",
      category: "cats",
    },
    {
      value: "/api/cats/increment-views",
      label: "Increment Views",
      method: "POST",
      description: "Increments the view count for a cat",
      defaultBody: JSON.stringify(
        {
          id: "PASTE_CAT_ID_HERE",
        },
        null,
        2,
      ),
      category: "cats",
    },
    {
      value: "/api/cats/upload/image",
      label: "Upload Cat Image",
      method: "POST",
      description: "Uploads an image for a cat (use form data in actual implementation)",
      defaultBody: JSON.stringify(
        {
          id: "PASTE_CAT_ID_HERE",
          imageBase64: "BASE64_ENCODED_IMAGE_DATA",
          isMainImage: true,
        },
        null,
        2,
      ),
      category: "cats",
    },
    {
      value: "/api/cats/upload/video",
      label: "Upload Cat Video",
      method: "POST",
      description: "Uploads a video for a cat (use form data in actual implementation)",
      defaultBody: JSON.stringify(
        {
          id: "PASTE_CAT_ID_HERE",
          videoFile: "VIDEO_FILE_OBJECT",
        },
        null,
        2,
      ),
      category: "cats",
    },
    {
      value: "/api/users",
      label: "Get All Users",
      method: "GET",
      description: "Fetches all users (admin only)",
      category: "users",
    },
    {
      value: "/api/users/search",
      label: "Search Users",
      method: "GET",
      description: "Searches for users by email",
      paramStructure: "email",
      paramPlaceholder: "Enter user email",
      category: "users",
    },
    {
      value: "/api/auth/check-admin",
      label: "Check Admin Status",
      method: "GET",
      description: "Checks if current user is an admin",
      category: "auth",
    },
    {
      value: "/api/auth/check-session",
      label: "Check Session",
      method: "GET",
      description: "Validates the current session",
      category: "auth",
    },
  ]

  // Get unique categories
  const categories = ["all", ...new Set(apiEndpoints.map((endpoint) => endpoint.category))]

  // Filter endpoints by category
  const filteredEndpoints =
    selectedCategory === "all"
      ? apiEndpoints
      : apiEndpoints.filter((endpoint) => endpoint.category === selectedCategory)

  useEffect(() => {
    // Set initial default values
    const defaultEndpoint = apiEndpoints[0]
    if (defaultEndpoint) {
      handleEndpointChange(defaultEndpoint.value, defaultEndpoint.label)
      setSelectedEndpointLabel(defaultEndpoint.label)
    }
  }, [])

  const handleEndpointChange = (value: string, label?: string) => {
    setEndpoint(value)
    if (label) {
      setSelectedEndpointLabel(label)
    }

    // Find the selected endpoint by value and label (to handle duplicate values like /api/cats)
    const selectedEndpoint = apiEndpoints.find((e) => e.value === value && (!label || e.label === label))

    if (selectedEndpoint) {
      setMethod(selectedEndpoint.method)
      setRequestBody(selectedEndpoint.defaultBody || "")

      // Handle parameter structure
      if (selectedEndpoint.paramStructure) {
        const params = selectedEndpoint.paramStructure.split(",")
        const placeholders = selectedEndpoint.paramPlaceholder ? selectedEndpoint.paramPlaceholder.split(",") : []

        const fields: ParamField[] = params.map((param, index) => ({
          name: param,
          placeholder: placeholders[index] || `Enter ${param} value`,
          required: true,
        }))

        setParamFields(fields)

        // Clear the query params
        setQueryParams("")
      } else {
        setParamFields([])
        setQueryParams("")
      }
    }
  }

  // Build query string from parameter fields
  const buildQueryString = () => {
    if (paramFields.length === 0) return queryParams

    const params = new URLSearchParams()
    let hasValues = false

    paramFields.forEach((field) => {
      const inputElement = document.getElementById(`param-${field.name}`) as HTMLInputElement
      if (inputElement && inputElement.value) {
        params.append(field.name, inputElement.value)
        hasValues = true
      }
    })

    return hasValues ? params.toString() : ""
  }

  // Modify the handleSendRequest function to save requests to history
  // Replace the existing handleSendRequest function with this updated version:
  const handleSendRequest = async () => {
    setLoading(true)
    setError(null)
    setResponse(null)
    setStatusCode(null)
    setResponseTime(null)

    try {
      const startTime = performance.now()

      // Build the URL with query parameters
      let url = endpoint
      const queryString = paramFields.length > 0 ? buildQueryString() : queryParams

      if (queryString) {
        url += `?${queryString}`
      }

      // Configure the request options
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      }

      // Add request body for non-GET requests
      if (method !== "GET" && requestBody) {
        options.body = requestBody
      }

      const res = await fetch(url, options)
      const endTime = performance.now()
      const responseTimeValue = Math.round(endTime - startTime)

      setResponseTime(responseTimeValue)
      setStatusCode(res.status)

      // Parse the response
      const data = await res.json()
      setResponse(data)

      // Add to history with response data
      const historyItem: RequestHistoryItem = {
        id: crypto.randomUUID(),
        endpoint,
        method,
        queryParams: queryString,
        requestBody,
        timestamp: new Date(),
        statusCode: res.status,
        responseTime: responseTimeValue,
        label: selectedEndpointLabel || endpoint,
        response: data,
        error: null,
      }
      setRequestHistory((prev) => [historyItem, ...prev.slice(0, 19)]) // Keep last 20 items
    } catch (err: any) {
      const errorMessage = err.message || "An error occurred"
      setError(errorMessage)

      // Add failed request to history
      const historyItem: RequestHistoryItem = {
        id: crypto.randomUUID(),
        endpoint,
        method,
        queryParams: paramFields.length > 0 ? buildQueryString() : queryParams,
        requestBody,
        timestamp: new Date(),
        statusCode: null,
        responseTime: null,
        label: selectedEndpointLabel || endpoint,
        response: null,
        error: errorMessage,
      }
      setRequestHistory((prev) => [historyItem, ...prev.slice(0, 19)])
    } finally {
      setLoading(false)
    }
  }

  // Add a function to load a request from history
  const loadFromHistory = (item: RequestHistoryItem) => {
    setEndpoint(item.endpoint)
    setMethod(item.method)
    setQueryParams(item.queryParams)
    setRequestBody(item.requestBody)
    setSelectedEndpointLabel(item.label)

    // Find the matching endpoint to set up param fields correctly
    const selectedEndpoint = apiEndpoints.find((e) => e.value === item.endpoint && e.label === item.label)

    if (selectedEndpoint?.paramStructure) {
      const params = selectedEndpoint.paramStructure.split(",")
      const placeholders = selectedEndpoint.paramPlaceholder ? selectedEndpoint.paramPlaceholder.split(",") : []

      const fields: ParamField[] = params.map((param, index) => ({
        name: param,
        placeholder: placeholders[index] || `Enter ${param} value`,
        required: true,
      }))

      setParamFields(fields)
    } else {
      setParamFields([])
    }
  }

  // Toggle expanded state for a history item
  const toggleHistoryItemExpansion = (id: string) => {
    setExpandedHistoryItem(expandedHistoryItem === id ? null : id)
  }

  // Add a function to format the timestamp
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date)
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

  const formatJson = (json: any) => {
    try {
      return JSON.stringify(json, null, 2)
    } catch (e) {
      return "Invalid JSON"
    }
  }

  // Determine if request was successful based on status code, not response content
  const isRequestSuccessful = statusCode !== null && statusCode >= 200 && statusCode < 300

  return (
    <div className="px-4 py-6 w-full max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Cat API Tester</h1>
          <p className="text-gray-500">Test and debug the Cat API endpoints</p>
        </div>
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-blue-500" />
          <span className="text-sm font-medium">API Testing Tool</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>Select an endpoint to test</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-4 pb-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ScrollArea className="h-[600px]">
                <div className="space-y-1 p-2">
                  {filteredEndpoints.map((apiEndpoint) => (
                    <Button
                      key={`${apiEndpoint.value}-${apiEndpoint.label}`}
                      variant={
                        endpoint === apiEndpoint.value && selectedEndpointLabel === apiEndpoint.label
                          ? "secondary"
                          : "ghost"
                      }
                      className="w-full justify-start text-left"
                      onClick={() => handleEndpointChange(apiEndpoint.value, apiEndpoint.label)}
                    >
                      <div className="flex items-center">
                        <Badge
                          className={`mr-2 ${
                            apiEndpoint.method === "GET"
                              ? "bg-blue-500"
                              : apiEndpoint.method === "POST"
                                ? "bg-green-500"
                                : apiEndpoint.method === "PUT"
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                          } hover:bg-opacity-90`}
                        >
                          {apiEndpoint.method}
                        </Badge>
                        <span className="truncate">{apiEndpoint.label}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Request</CardTitle>
              <CardDescription>Configure your API request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="endpoint" className="text-sm font-medium">
                  Endpoint
                </label>
                <div className="flex items-center space-x-2">
                  <Badge
                    className={`${
                      method === "GET"
                        ? "bg-blue-500"
                        : method === "POST"
                          ? "bg-green-500"
                          : method === "PUT"
                            ? "bg-amber-500"
                            : "bg-red-500"
                    } hover:bg-opacity-90`}
                  >
                    {method}
                  </Badge>
                  <span className="font-mono text-sm">{endpoint}</span>
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <div className="text-sm text-gray-500">
                  {apiEndpoints.find((e) => e.value === endpoint && e.label === selectedEndpointLabel)?.description ||
                    "No description available"}
                </div>
              </div>

              <Separator />

              {paramFields.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-sm font-medium">Query Parameters</div>
                  {paramFields.map((field) => (
                    <div key={field.name} className="flex flex-col space-y-1.5">
                      <label htmlFor={`param-${field.name}`} className="text-xs text-gray-500 flex items-center">
                        {field.name}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <Input id={`param-${field.name}`} placeholder={field.placeholder} className="font-mono" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="queryParams" className="text-sm font-medium">
                    Query Parameters
                  </label>
                  <Input
                    id="queryParams"
                    placeholder="e.g. id=123&includeDeleted=true"
                    value={queryParams}
                    onChange={(e) => setQueryParams(e.target.value)}
                    className="font-mono"
                  />
                </div>
              )}

              <Tabs defaultValue={method !== "GET" ? "body" : "none"} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="none" disabled={method !== "GET"}>
                    No Body
                  </TabsTrigger>
                  <TabsTrigger value="body">Request Body</TabsTrigger>
                </TabsList>
                <TabsContent value="none">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-center text-sm text-gray-500">
                    GET requests typically don't have a request body
                  </div>
                </TabsContent>
                <TabsContent value="body">
                  <Textarea
                    placeholder="Enter JSON request body"
                    className="font-mono h-80"
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSendRequest} className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Send Request
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card className="h-full">
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
                  <div className="flex items-center space-x-2">
                    <Code className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium">Response Body</span>
                  </div>
                  <ScrollArea className="h-[500px] w-full rounded-md border p-4 font-mono text-sm">
                    <pre>{formatJson(response)}</pre>
                  </ScrollArea>
                  <div className="flex items-center space-x-2">
                    {isRequestSuccessful ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-sm">
                      {isRequestSuccessful ? "Request successful" : "Request failed"}
                      {response.message && `: ${response.message}`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500 space-y-2">
                  <ArrowRight className="h-8 w-8" />
                  <p>Send a request to see the response</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Request History Panel */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <Button variant="outline" onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2">
            {showHistory ? "Hide History" : "Show History"}
            <span className="bg-gray-200 dark:bg-gray-700 text-xs rounded-full px-2 py-0.5">
              {requestHistory.length}
            </span>
          </Button>
          {showHistory && requestHistory.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setRequestHistory([])}>
              Clear All
            </Button>
          )}
        </div>

        {showHistory && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle>Request History</CardTitle>
              <CardDescription>Previously sent API requests</CardDescription>
            </CardHeader>
            <CardContent>
              {requestHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No request history yet</p>
                  <p className="text-sm mt-1">Send requests to see them here</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {requestHistory.map((item) => (
                      <Collapsible
                        key={item.id}
                        open={expandedHistoryItem === item.id}
                        onOpenChange={() => toggleHistoryItemExpansion(item.id)}
                        className="border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="p-3 cursor-pointer" onClick={() => loadFromHistory(item)}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                className={`${
                                  item.method === "GET"
                                    ? "bg-blue-500"
                                    : item.method === "POST"
                                      ? "bg-green-500"
                                      : item.method === "PUT"
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                                }`}
                              >
                                {item.method}
                              </Badge>
                              <span className="font-medium">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {item.statusCode && (
                                <Badge
                                  className={
                                    item.statusCode >= 200 && item.statusCode < 300
                                      ? "bg-green-500"
                                      : item.statusCode >= 400 && item.statusCode < 500
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                                  }
                                >
                                  {item.statusCode}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">{formatTimestamp(item.timestamp)}</span>
                              <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                                  {expandedHistoryItem === item.id ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                            </div>
                          </div>
                          <div className="text-sm font-mono truncate text-gray-500">
                            {item.endpoint}
                            {item.queryParams ? `?${item.queryParams}` : ""}
                          </div>
                          {item.responseTime && (
                            <div className="text-xs text-gray-500 mt-1">Response time: {item.responseTime}ms</div>
                          )}
                        </div>
                        <CollapsibleContent>
                          <div className="px-3 pb-3 pt-1 border-t">
                            <Tabs defaultValue="response">
                              <TabsList className="w-full">
                                <TabsTrigger value="response">Response</TabsTrigger>
                                <TabsTrigger value="request">Request Body</TabsTrigger>
                              </TabsList>
                              <TabsContent value="response">
                                {item.error ? (
                                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800 mt-2">
                                    <div className="flex items-start">
                                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
                                      <div>
                                        <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error</h3>
                                        <p className="text-sm text-red-700 dark:text-red-400 mt-1">{item.error}</p>
                                      </div>
                                    </div>
                                  </div>
                                ) : item.response ? (
                                  <ScrollArea className="h-[200px] w-full rounded-md border p-3 font-mono text-sm mt-2">
                                    <pre>{formatJson(item.response)}</pre>
                                  </ScrollArea>
                                ) : (
                                  <div className="text-center py-4 text-gray-500">No response data available</div>
                                )}
                              </TabsContent>
                              <TabsContent value="request">
                                {item.requestBody ? (
                                  <ScrollArea className="h-[200px] w-full rounded-md border p-3 font-mono text-sm mt-2">
                                    <pre>{item.requestBody}</pre>
                                  </ScrollArea>
                                ) : (
                                  <div className="text-center py-4 text-gray-500">No request body</div>
                                )}
                              </TabsContent>
                            </Tabs>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>API Documentation</CardTitle>
            <CardDescription>Detailed information about the available endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="usage">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="usage">Usage Guide</TabsTrigger>
                <TabsTrigger value="endpoints">Endpoint Reference</TabsTrigger>
                <TabsTrigger value="examples">Example Requests</TabsTrigger>
              </TabsList>
              <TabsContent value="usage" className="p-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">How to use this API tester</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Select an endpoint from the sidebar on the left</li>
                    <li>For endpoints requiring parameters, fill in the labeled input fields</li>
                    <li>For endpoints requiring a request body, edit the pre-populated JSON</li>
                    <li>Click "Send Request" to execute the API call</li>
                    <li>View the response in the right panel</li>
                  </ol>

                  <h3 className="text-lg font-medium mt-6">Authentication</h3>
                  <p>
                    Most endpoints require authentication. The tester uses your current browser session for
                    authentication. If you're not logged in or don't have the required permissions, you'll receive
                    appropriate error responses.
                  </p>

                  <h3 className="text-lg font-medium mt-6">Common Parameters</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Parameter</th>
                        <th className="text-left py-2 px-4">Description</th>
                        <th className="text-left py-2 px-4">Example</th>
                      </tr>
                      </thead>
                      <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-mono">id</td>
                        <td className="py-2 px-4">The unique identifier for a cat</td>
                        <td className="py-2 px-4 font-mono">0iDb1ATRpxAx439eEgfm</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-mono">name</td>
                        <td className="py-2 px-4">The name of a cat</td>
                        <td className="py-2 px-4 font-mono">Fluffy</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-mono">permanent</td>
                        <td className="py-2 px-4">Whether to permanently delete a cat</td>
                        <td className="py-2 px-4 font-mono">true</td>
                      </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="endpoints" className="p-4">
                <div className="space-y-6">
                  {categories
                    .filter((cat) => cat !== "all")
                    .map((category) => (
                      <div key={category} className="space-y-4">
                        <h3 className="text-xl font-bold capitalize">{category} Endpoints</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-4">Endpoint</th>
                              <th className="text-left py-2 px-4">Method</th>
                              <th className="text-left py-2 px-4">Description</th>
                            </tr>
                            </thead>
                            <tbody>
                            {apiEndpoints
                              .filter((endpoint) => endpoint.category === category)
                              .map((endpoint, index) => (
                                <tr key={index} className="border-b">
                                  <td className="py-2 px-4 font-mono">{endpoint.value}</td>
                                  <td className="py-2 px-4">
                                    <Badge
                                      className={`${
                                        endpoint.method === "GET"
                                          ? "bg-blue-500"
                                          : endpoint.method === "POST"
                                            ? "bg-green-500"
                                            : endpoint.method === "PUT"
                                              ? "bg-amber-500"
                                              : "bg-red-500"
                                      }`}
                                    >
                                      {endpoint.method}
                                    </Badge>
                                  </td>
                                  <td className="py-2 px-4">{endpoint.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
              <TabsContent value="examples" className="p-4">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Example: Creating a new cat</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Request</h4>
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md font-mono text-sm">
                        <p>POST /api/cats/add</p>
                        <p>Content-Type: application/json</p>
                        <pre>
                          {JSON.stringify(
                            {
                              name: "Whiskers",
                              breed: "British Shorthair",
                              color: "black",
                              gender: "Male",
                              category: "Domestic",
                              description: "A friendly and playful cat",
                              yearOfBirth: 2023,
                              isVaccinated: true,
                              isCastrated: true,
                              isMicrochipped: true,
                              mainImage:
                                "https://firebasestorage.googleapis.com/v0/b/redcatcuasar.firebasestorage.app/o/cats%2Fimages%2Fsample-image.jpeg?alt=media&token=sample-token",
                              images: [
                                "https://firebasestorage.googleapis.com/v0/b/redcatcuasar.firebasestorage.app/o/cats%2Fsample-id%2Fimages%2Fsample-image-1.jpg?alt=media&token=sample-token-1",
                              ],
                              videos: [
                                "https://firebasestorage.googleapis.com/v0/b/redcatcuasar.firebasestorage.app/o/cats%2Fsample-id%2Fvideos%2Fsample-video-1.mp4?alt=media&token=sample-token-2",
                              ],
                            },
                            null,
                            2,
                          )}
                        </pre>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Response</h4>
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md font-mono text-sm">
                        <p>HTTP/1.1 200 OK</p>
                        <p>Content-Type: application/json</p>
                        <pre>
                          {JSON.stringify(
                            {
                              success: true,
                              message: "Cat added successfully",
                              id: "0iDb1ATRpxAx439eEgfm",
                            },
                            null,
                            2,
                          )}
                        </pre>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-medium mt-6">Example: Updating a cat</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Request</h4>
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md font-mono text-sm">
                        <p>PUT /api/cats/update</p>
                        <p>Content-Type: application/json</p>
                        <pre>
                          {JSON.stringify(
                            {
                              id: "0iDb1ATRpxAx439eEgfm",
                              name: "Whiskers Jr.",
                              breed: "British Shorthair",
                              color: "gray",
                              gender: "Female",
                              yearOfBirth: 2022,
                              isVaccinated: true,
                              isCastrated: true,
                              isMicrochipped: true,
                              description: "Updated description",
                            },
                            null,
                            2,
                          )}
                        </pre>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Response</h4>
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md font-mono text-sm">
                        <p>HTTP/1.1 200 OK</p>
                        <p>Content-Type: application/json</p>
                        <pre>
                          {JSON.stringify(
                            {
                              success: true,
                              message: "Cat updated successfully",
                            },
                            null,
                            2,
                          )}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
