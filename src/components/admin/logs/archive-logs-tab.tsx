"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { subDays } from "date-fns"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import ArchivedLogsViewer from "./archived-logs-viewer"

export function ArchiveLogsTab() {
  const [activeTab, setActiveTab] = useState<string>("archive")
  const [daysAgo, setDaysAgo] = useState<number>(30)
  const [isArchiving, setIsArchiving] = useState<boolean>(false)
  const [archiveResult, setArchiveResult] = useState<{
    success: boolean
    message: string
    archived?: number
    hasMore?: boolean
    inProgress?: boolean
    operationId?: string
  } | null>(null)
  const [progress, setProgress] = useState<{
    inProgress: boolean
    total: number
    processed: number
    percentage: number
    completed?: boolean
    error?: string
  } | null>(null)

  const handleDaysPreset = (days: number) => {
    setDaysAgo(days)
  }

  // Poll for progress updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (archiveResult?.inProgress && archiveResult?.operationId) {
      // Start polling
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`/api/logs/archive/progress?operationId=${archiveResult.operationId}`)
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
          }

          const data = await response.json()
          setProgress(data)

          // If the operation is complete, stop polling and update the result
          if (data.completed || data.error) {
            clearInterval(intervalId!)
            setIsArchiving(false)

            if (data.completed) {
              setArchiveResult({
                success: true,
                message: `Successfully archived ${data.processed} logs`,
                archived: data.processed,
                hasMore: false,
              })
            } else if (data.error) {
              setArchiveResult({
                success: false,
                message: `Error archiving logs: ${data.error}`,
              })
            }
          }
        } catch (error) {
          console.error("Error polling for progress:", error)
        }
      }, 2000) // Poll every 2 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [archiveResult])

  const handleArchiveLogs = async () => {
    if (!daysAgo || daysAgo <= 0) {
      setArchiveResult({
        success: false,
        message: "Please enter a valid number of days",
      })
      return
    }

    try {
      setIsArchiving(true)
      setArchiveResult(null)
      setProgress(null)

      // Calculate the date based on days ago
      const beforeDate = subDays(new Date(), daysAgo).toISOString()

      const response = await fetch("/api/logs/archive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          beforeDate,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`API error: ${response.status} - ${errorData.error || "Unknown error"}`)
      }

      const result = await response.json()

      if (result.inProgress) {
        // Operation is running in the background
        setArchiveResult({
          success: true,
          message: result.message,
          inProgress: true,
          operationId: result.operationId,
        })

        // Initialize progress
        setProgress({
          inProgress: true,
          total: result.total,
          processed: 0,
          percentage: 0,
        })
      } else {
        // Operation completed immediately
        setIsArchiving(false)
        setArchiveResult({
          success: true,
          message: result.message || `Successfully archived ${result.archived} logs`,
          archived: result.archived,
          hasMore: result.hasMore,
        })
      }
    } catch (error: any) {
      console.error("Error archiving logs:", error)
      setIsArchiving(false)
      setArchiveResult({
        success: false,
        message: error.message || "Failed to archive logs",
      })
    }
  }

  return (
    <Tabs defaultValue="archive" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="archive">Archive Logs</TabsTrigger>
        <TabsTrigger value="view">View Archived Logs</TabsTrigger>
      </TabsList>

      <TabsContent value="archive" className="space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Archive Old Logs</CardTitle>
            <CardDescription>
              Move older logs to the archive to improve system performance while preserving historical data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Archive logs older than:</div>
              <div className="flex flex-wrap gap-2 items-center">
                <Input
                  type="number"
                  min="1"
                  value={daysAgo}
                  onChange={(e) => setDaysAgo(Number.parseInt(e.target.value) || 0)}
                  className="w-24"
                />
                <span className="text-sm">days ago</span>

                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleDaysPreset(30)}>
                    30 days
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDaysPreset(60)}>
                    60 days
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDaysPreset(90)}>
                    90 days
                  </Button>
                </div>
              </div>
            </div>

            <Button onClick={handleArchiveLogs} disabled={isArchiving || daysAgo <= 0}>
              {isArchiving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Archiving...
                </>
              ) : (
                "Archive Logs"
              )}
            </Button>

            {progress && progress.inProgress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Archiving logs...</span>
                  <span>
                    {progress.processed} of {progress.total} ({progress.percentage}%)
                  </span>
                </div>
                <Progress value={progress.percentage} className="h-2" />
              </div>
            )}

            {archiveResult && !progress?.inProgress && (
              <Alert variant={archiveResult.success ? "default" : "destructive"}>
                {archiveResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{archiveResult.success ? "Success" : "Error"}</AlertTitle>
                <AlertDescription>{archiveResult.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="view" className="mt-4">
        <ArchivedLogsViewer />
      </TabsContent>
    </Tabs>
  )
}
