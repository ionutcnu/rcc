"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ArrowRight, CheckCircle, Code, Database, Play, RefreshCw, XCircle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

// Define the API endpoint types
type ApiEndpoint = {
  value: string
  label: string
  method: string
  description: string
  defaultParams?: string
  defaultBody?: string
  category: string
}

export default function CatApiTesterPage() {
  const [endpoint, setEndpoint] = useState("/api/cats")
  const [method, setMethod] = useState("GET")
  const [requestBody, setRequestBody] = useState("")
  const [queryParams, setQueryParams] = useState("")
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusCode, setStatusCode] = useState<number | null>(null)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Enhanced API endpoints with categories, descriptions and default values
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
      defaultParams: "id=REPLACE_WITH_CAT_ID",
      category: "cats",
    },
    {
      value: "/api/cats/by-name",
      label: "Get Cat by Name",
      method: "GET",
      description: "Fetches a cat by its name",
      defaultParams: "name=REPLACE_WITH_CAT_NAME",
      category: "cats",
    },
    {
      value: "/api/cats/add",
      label: "Add Cat",
      method: "POST",
      description: "Creates a new cat profile",
      defaultBody: JSON.stringify(
        {
          name: "New Test Cat",
          breed: "British Shorthair",
          age: 2,
          category: "Domestic",
          description: "A lovely test cat",
          gender: "female",
          color: "gray",
          available: true,
        },
        null,
        2,
      ),
      category: "cats",
    },
    {
      value: "/api/cats/update",
      label: "Update Cat",
      method: "PUT",
      description: "Updates an existing cat profile",
      defaultBody: JSON.stringify(
        {
          id: "REPLACE_WITH_CAT_ID",
          name: "Updated Cat Name",
          breed: "Updated Breed",
          age: 3,
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
      defaultParams: "id=REPLACE_WITH_CAT_ID&permanent=false",
      category: "cats",
    },
    {
      value: "/api/cats/restore",
      label: "Restore Cat",
      method: "POST",
      description: "Restores a soft-deleted cat",
      defaultBody: JSON.stringify(
        {
          id: "REPLACE_WITH_CAT_ID",
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
          id: "REPLACE_WITH_CAT_ID",
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
      defaultParams: "email=REPLACE_WITH_EMAIL",
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
      handleEndpointChange(defaultEndpoint.value)
    }
  }, [])

  const handleEndpointChange = (value: string) => {
    setEndpoint(value)
    const selectedEndpoint = apiEndpoints.find((e) => e.value === value)
    if (selectedEndpoint) {
      setMethod(selectedEndpoint.method)
      setQueryParams(selectedEndpoint.defaultParams || "")
      setRequestBody(selectedEndpoint.defaultBody || "")
    }
  }

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
      if (queryParams && !url.includes("?")) {
        url += `?${queryParams}`
      } else if (queryParams && url.includes("?")) {
        // Handle the special case for /api/cats?id=
        if (url === "/api/cats" && queryParams.startsWith("id=")) {
          url = `/api/cats?${queryParams}`
        } else {
          url += `&${queryParams}`
        }
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

      setResponseTime(Math.round(endTime - startTime))
      setStatusCode(res.status)

      // Parse the response
      const data = await res.json()
      setResponse(data)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
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
                      variant={endpoint === apiEndpoint.value ? "secondary" : "ghost"}
                      className="w-full justify-start text-left"
                      onClick={() => handleEndpointChange(apiEndpoint.value)}
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
                  {apiEndpoints.find((e) => e.value === endpoint)?.description || "No description available"}
                </div>
              </div>

              <Separator />

              <div className="flex flex-col space-y-1.5">
                <label htmlFor="queryParams" className="text-sm font-medium">
                  Query Parameters
                </label>
                <Input
                  id="queryParams"
                  placeholder="e.g. id=123&includeDeleted=true"
                  value={queryParams}
                  onChange={(e) => setQueryParams(e.target.value)}
                />
              </div>

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
                    className="font-mono h-60"
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
                    <li>Review the automatically populated query parameters and request body</li>
                    <li>Modify the parameters as needed for your test case</li>
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
                        <td className="py-2 px-4 font-mono">id=abc123</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-mono">name</td>
                        <td className="py-2 px-4">The name of a cat</td>
                        <td className="py-2 px-4 font-mono">name=Fluffy</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-mono">permanent</td>
                        <td className="py-2 px-4">Whether to permanently delete a cat</td>
                        <td className="py-2 px-4 font-mono">permanent=true</td>
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
                              breed: "Maine Coon",
                              age: 3,
                              category: "Domestic",
                              description: "A friendly and playful cat",
                              gender: "male",
                              color: "brown tabby",
                              available: true,
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
                              id: "new-cat-id-123",
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
                              id: "existing-cat-id",
                              name: "Whiskers Jr.",
                              age: 4,
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
