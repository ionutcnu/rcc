"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Search, AlertTriangle, CheckCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
// Don't directly import the validator that might use server-only code
// import { validateAllMedia } from "@/lib/utils/media-validator"

export default function ValidateMediaPage() {
    const [isValidating, setIsValidating] = useState(false)
    const [progress, setProgress] = useState(0)
    const [results, setResults] = useState<{
        broken: string[]
        missing: string[]
        valid: string[]
        total: number
    }>({
        broken: [],
        missing: [],
        valid: [],
        total: 0,
    })

    const startValidation = async () => {
        setIsValidating(true)
        setProgress(0)
        setResults({
            broken: [],
            missing: [],
            valid: [],
            total: 0,
        })

        try {
            // Use the API endpoint instead of direct function call
            const response = await fetch("/api/media/validate")
            const validationResults = await response.json()

            // Update progress to 100% when complete
            setProgress(100)
            setResults(validationResults)
        } catch (error) {
            console.error("Validation error:", error)
        } finally {
            setIsValidating(false)
            setProgress(100)
        }
    }

    return (
      <div className="container mx-auto py-6">
          <div className="flex items-center mb-6">
              <Link href="/admin/debug" className="mr-4">
                  <Button variant="outline" size="sm">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Debug Tools
                  </Button>
              </Link>
              <div>
                  <h1 className="text-3xl font-bold">Validate Media</h1>
                  <p className="text-gray-500">Check for broken or missing media files</p>
              </div>
          </div>

          <Card className="mb-6">
              <CardHeader>
                  <CardTitle className="flex items-center">
                      <Search className="h-5 w-5 mr-2 text-blue-500" />
                      Media Validation Tool
                  </CardTitle>
                  <CardDescription>
                      This tool scans all media references in the database and checks if they exist in storage
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      <Button onClick={startValidation} disabled={isValidating} className="w-full sm:w-auto">
                          {isValidating ? "Validating..." : "Start Media Validation"}
                      </Button>

                      {isValidating && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Scanning media files...</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                      )}

                      {results.total > 0 && (
                        <div className="space-y-4 mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-medium">Valid Media</p>
                                                <p className="text-2xl font-bold text-green-500">{results.valid.length}</p>
                                            </div>
                                            <CheckCircle className="h-8 w-8 text-green-500" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-medium">Missing Files</p>
                                                <p className="text-2xl font-bold text-amber-500">{results.missing.length}</p>
                                            </div>
                                            <AlertTriangle className="h-8 w-8 text-amber-500" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-medium">Broken References</p>
                                                <p className="text-2xl font-bold text-red-500">{results.broken.length}</p>
                                            </div>
                                            <AlertTriangle className="h-8 w-8 text-red-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {(results.missing.length > 0 || results.broken.length > 0) && (
                              <Alert variant="destructive">
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertTitle>Issues detected</AlertTitle>
                                  <AlertDescription>
                                      Found {results.missing.length + results.broken.length} issues with media files.
                                  </AlertDescription>
                              </Alert>
                            )}

                            {results.missing.length > 0 && (
                              <div>
                                  <h3 className="text-lg font-medium mb-2">Missing Files ({results.missing.length})</h3>
                                  <div className="bg-gray-50 p-3 rounded-md max-h-40 overflow-y-auto text-sm">
                                      {results.missing.map((path, i) => (
                                        <div key={i} className="mb-1 pb-1 border-b border-gray-100">
                                            {path}
                                        </div>
                                      ))}
                                  </div>
                              </div>
                            )}

                            {results.broken.length > 0 && (
                              <div>
                                  <h3 className="text-lg font-medium mb-2">Broken References ({results.broken.length})</h3>
                                  <div className="bg-gray-50 p-3 rounded-md max-h-40 overflow-y-auto text-sm">
                                      {results.broken.map((path, i) => (
                                        <div key={i} className="mb-1 pb-1 border-b border-gray-100">
                                            {path}
                                        </div>
                                      ))}
                                  </div>
                              </div>
                            )}
                        </div>
                      )}
                  </div>
              </CardContent>
          </Card>
      </div>
    )
}
