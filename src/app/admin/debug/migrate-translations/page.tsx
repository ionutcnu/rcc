"use client"

import { useState } from "react"
import { showErrorToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, CheckCircle, AlertCircle, Database } from "lucide-react"
import Link from "next/link"

export default function MigrateTranslationsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [limit, setLimit] = useState(365)
  const [progress, setProgress] = useState(0)

  const handleMigrate = async () => {
    setIsLoading(true)
    setSuccess(false)
    setProgress(10)

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 5
          return newProgress < 90 ? newProgress : prev
        })
      }, 500)

      const response = await fetch("/api/translate/migrate-usage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ limit }),
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to migrate translation usage history")
      }

      const data = await response.json()
      setProgress(100)
      setSuccess(true)
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "An unknown error occurred")
      setProgress(0)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/admin/debug" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Debug
        </Link>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Database className="mr-2 h-6 w-6" />
            Migrate Translation Usage History
          </CardTitle>
          <CardDescription>
            Transfer translation usage history from Firebase to Redis for improved performance and reduced costs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Migration Successful</AlertTitle>
              <AlertDescription className="text-green-700">
                Translation usage history has been successfully migrated to Redis. Future usage will be stored in Redis
                automatically.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="limit">Days of History to Migrate</Label>
              <Input
                id="limit"
                type="number"
                min="1"
                max="1000"
                value={limit}
                onChange={(e) => setLimit(Number.parseInt(e.target.value) || 365)}
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500">
                Specify how many days of translation usage history to migrate from Firebase to Redis.
              </p>
            </div>

            {isLoading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Migration Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-gray-500">
                  Please wait while we migrate your translation usage history. This may take a few minutes depending on
                  the amount of data.
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleMigrate} disabled={isLoading}>
            {isLoading ? "Migrating..." : "Start Migration"}
          </Button>
        </CardFooter>
      </Card>

      <Card className="max-w-2xl mx-auto mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Migration Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium">What This Does</h3>
              <p className="text-gray-600">
                This tool migrates your translation usage history from Firebase Firestore to Redis, which provides
                faster access and reduced costs for frequently accessed data.
              </p>
            </div>

            <div>
              <h3 className="font-medium">Benefits</h3>
              <ul className="list-disc pl-5 text-gray-600 space-y-1">
                <li>Faster access to translation usage data</li>
                <li>Reduced Firestore read operations</li>
                <li>Improved performance for translation-related features</li>
                <li>Automatic expiration of old usage data</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium">Important Notes</h3>
              <ul className="list-disc pl-5 text-gray-600 space-y-1">
                <li>The migration is non-destructive - your original data in Firebase will remain untouched</li>
                <li>After migration, new translation usage will be recorded in Redis instead of Firebase</li>
                <li>Redis data has a 2-year expiration period to optimize storage</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
