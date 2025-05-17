"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { subDays } from "date-fns"
import { Loader2, AlertCircle, Trash2, Info } from "lucide-react"
import ArchivedLogsViewer from "./archived-logs-viewer"

export function ArchiveLogsTab() {
  const [activeTab, setActiveTab] = useState<string>("archive")
  const [daysAgo, setDaysAgo] = useState<number>(30)
  const [isArchiving, setIsArchiving] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [deleteBeforeDate, setDeleteBeforeDate] = useState<number>(90)
  const [deleteAll, setDeleteAll] = useState<boolean>(false)
  const [archiveResult, setArchiveResult] = useState<{
    success: boolean
    message: string
    archived?: number
    hasMore?: boolean
    inProgress?: boolean
    operationId?: string
  } | null>(null)
  const [deleteResult, setDeleteResult] = useState<{
    success: boolean
    message: string
    deleted?: number
    hasMore?: boolean
    inProgress?: boolean
    operationId?: string
  } | null>(null)
  const [archiveProgress, setArchiveProgress] = useState<{
    inProgress: boolean
    total: number
    processed: number
    percentage: number
    completed?: boolean
    error?: string
    message?: string
  } | null>(null)
  const [deleteProgress, setDeleteProgress] = useState<{
    inProgress: boolean
    total: number
    processed: number
    percentage: number
    completed?: boolean
    error?: string
    message?: string
  } | null>(null)
  const [archivePollCount, setArchivePollCount] = useState<number>(0)
  const [deletePollCount, setDeletePollCount] = useState<number>(0)

  const handleDaysPreset = (days: number) => {
    setDaysAgo(days)
  }

  const handleDeleteDaysPreset = (days: number) => {
    setDeleteBeforeDate(days)
  }

  // Poll for archive progress updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (archiveResult?.inProgress && archiveResult?.operationId) {
      console.log("Starting to poll for archive progress with operationId:", archiveResult.operationId)

      // Start polling
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`/api/logs/archive/progress?operationId=${archiveResult.operationId}`)

          console.log("Archive progress response status:", response.status)

          if (!response.ok) {
            setArchivePollCount((prev) => prev + 1)
            throw new Error(`API error: ${response.status}`)
          }

          const data = await response.json()
          console.log("Archive progress data:", data)

          // Reset poll count on successful response
          setArchivePollCount(0)

          setArchiveProgress(data)

          // If the operation is complete, stop polling and update the result
          if (data.completed || data.error) {
            console.log("Archive operation completed:", data)
            clearInterval(intervalId!)
            setIsArchiving(false)

            if (data.completed) {
              setArchiveResult({
                success: true,
                message: data.message || `Successfully archived ${data.processed} logs`,
                archived: data.processed,
                hasMore: false,
                inProgress: false,
              })
            } else if (data.error) {
              setArchiveResult({
                success: false,
                message: `Error archiving logs: ${data.error}`,
                inProgress: false,
              })
            }
          }
        } catch (error) {
          console.error("Error polling for archive progress:", error)

          // After 5 failed attempts, try to get the final result directly
          if (archivePollCount >= 5) {
            try {
              // Try to get the final result directly from Redis
              const finalResponse = await fetch(
                `/api/logs/archive/final-result?operationId=${archiveResult.operationId}`,
              )

              if (finalResponse.ok) {
                const finalData = await finalResponse.json()
                console.log("Final archive result data:", finalData)

                if (finalData && finalData.completed) {
                  clearInterval(intervalId!)
                  setIsArchiving(false)
                  setArchiveProgress(finalData)
                  setArchiveResult({
                    success: true,
                    message: finalData.message || `Successfully archived ${finalData.processed} logs`,
                    archived: finalData.processed,
                    hasMore: false,
                    inProgress: false,
                  })
                  return
                }
              }
            } catch (finalError) {
              console.error("Error getting final archive result:", finalError)
            }

            // After 10 failed attempts, stop polling
            if (archivePollCount >= 10) {
              clearInterval(intervalId!)
              setIsArchiving(false)
              setArchiveResult((prev) => ({
                ...prev!,
                inProgress: false,
                message: "Failed to get progress updates. The operation may still be running in the background.",
              }))
            }
          }
        }
      }, 2000) // Poll every 2 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [archiveResult, archivePollCount])

  // Poll for delete progress updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (deleteResult?.inProgress && deleteResult?.operationId) {
      console.log("Starting to poll for delete progress with operationId:", deleteResult.operationId)

      // Start polling
      intervalId = setInterval(async () => {
        try {
          console.log(`Polling delete progress for ${deleteResult.operationId}...`)
          const response = await fetch(`/api/logs/archived/delete/progress?operationId=${deleteResult.operationId}`)

          console.log("Delete progress response status:", response.status)

          if (!response.ok) {
            setDeletePollCount((prev) => prev + 1)
            throw new Error(`API error: ${response.status}`)
          }

          const data = await response.json()
          console.log("Delete progress data:", data)

          // Reset poll count on successful response
          setDeletePollCount(0)

          // Update progress state
          setDeleteProgress(data)

          // If the operation is complete, stop polling and update the result
          if (data.completed || data.error) {
            console.log("Delete operation completed:", data)
            clearInterval(intervalId!)
            setIsDeleting(false)

            if (data.completed) {
              setDeleteResult({
                success: true,
                message: data.message || `Successfully deleted ${data.processed} archived logs`,
                deleted: data.processed,
                hasMore: false,
                inProgress: false,
              })
            } else if (data.error) {
              setDeleteResult({
                success: false,
                message: `Error deleting logs: ${data.error}`,
                inProgress: false,
              })
            }
          }
        } catch (error) {
          console.error("Error polling for delete progress:", error)
          setDeletePollCount((prev) => prev + 1)

          // After 5 failed attempts, try to get the final result directly
          if (deletePollCount >= 5) {
            try {
              console.log(`Trying to get final result for ${deleteResult.operationId}...`)
              // Try to get the final result directly from Redis
              const finalResponse = await fetch(
                `/api/logs/archived/delete/final-result?operationId=${deleteResult.operationId}`,
              )

              console.log("Final result response status:", finalResponse.status)

              if (finalResponse.ok) {
                const finalData = await finalResponse.json()
                console.log("Final delete result data:", finalData)

                if (finalData && finalData.completed) {
                  clearInterval(intervalId!)
                  setIsDeleting(false)
                  setDeleteProgress(finalData)
                  setDeleteResult({
                    success: true,
                    message: finalData.message || `Successfully deleted ${finalData.processed} archived logs`,
                    deleted: finalData.processed,
                    hasMore: false,
                    inProgress: false,
                  })
                  return
                }
              }
            } catch (finalError) {
              console.error("Error getting final delete result:", finalError)
            }

            // After 10 failed attempts, stop polling
            if (deletePollCount >= 10) {
              clearInterval(intervalId!)
              setIsDeleting(false)
              setDeleteResult((prev) => ({
                ...prev!,
                inProgress: false,
                message: "Failed to get progress updates. The operation may still be running in the background.",
              }))
            }
          }
        }
      }, 2000) // Poll every 2 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [deleteResult, deletePollCount])

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
      setArchiveProgress(null)
      setArchivePollCount(0)

      // Calculate the date based on days ago
      const beforeDate = subDays(new Date(), daysAgo).toISOString()

      console.log("Sending archive request with beforeDate:", beforeDate)

      const response = await fetch("/api/logs/archive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          beforeDate,
        }),
      })

      console.log("Archive response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`API error: ${response.status} - ${errorData.error || "Unknown error"}`)
      }

      const result = await response.json()
      console.log("Archive response data:", result)

      setArchiveResult({
        success: true,
        message: result.message || "Archive operation started",
        inProgress: true,
        operationId: result.operationId,
      })

      // Initialize progress
      setArchiveProgress({
        inProgress: true,
        total: result.total || 0,
        processed: 0,
        percentage: 0,
      })
    } catch (error: any) {
      console.error("Error archiving logs:", error)
      setIsArchiving(false)
      setArchiveResult({
        success: false,
        message: error.message || "Failed to archive logs",
      })
    }
  }

  const handleDeleteArchivedLogs = async () => {
    if (!deleteBeforeDate || deleteBeforeDate <= 0) {
      setDeleteResult({
        success: false,
        message: "Please enter a valid number of days",
      })
      return
    }

    try {
      setIsDeleting(true)
      setDeleteResult(null)
      setDeleteProgress(null)
      setDeletePollCount(0)

      // Calculate the date based on days ago
      const beforeDate = subDays(new Date(), deleteBeforeDate).toISOString()

      console.log("Sending delete request with beforeDate:", beforeDate)

      const response = await fetch("/api/logs/archived/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          beforeDate,
        }),
      })

      console.log("Delete response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`API error: ${response.status} - ${errorData.error || "Unknown error"}`)
      }

      const result = await response.json()
      console.log("Delete response data:", result)

      setDeleteResult({
        success: true,
        message: result.message || "Delete operation started",
        inProgress: true,
        operationId: result.operationId,
      })

      // Initialize progress
      setDeleteProgress({
        inProgress: true,
        total: 0,
        processed: 0,
        percentage: 0,
      })

      // Start polling immediately
      setTimeout(() => {
        console.log(`Immediate poll for delete progress: ${result.operationId}`)
        fetch(`/api/logs/archived/delete/progress?operationId=${result.operationId}`)
          .then((response) => {
            console.log("Immediate poll response status:", response.status)
            if (response.ok) return response.json()
            throw new Error(`API error: ${response.status}`)
          })
          .then((data) => {
            console.log("Immediate poll data:", data)
            if (data) setDeleteProgress(data)
          })
          .catch((error) => console.error("Error in immediate poll:", error))
      }, 500)
    } catch (error: any) {
      console.error("Error deleting archived logs:", error)
      setIsDeleting(false)
      setDeleteResult({
        success: false,
        message: error.message || "Failed to delete archived logs",
      })
    }
  }

  const handleDeleteAllArchivedLogs = async () => {
    if (!confirm("Are you sure you want to delete ALL archived logs? This action cannot be undone.")) {
      return
    }

    try {
      setIsDeleting(true)
      setDeleteResult(null)
      setDeleteProgress(null)
      setDeletePollCount(0)

      console.log("Sending delete ALL request")

      const response = await fetch("/api/logs/archived/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deleteAll: true,
        }),
      })

      console.log("Delete ALL response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`API error: ${response.status} - ${errorData.error || "Unknown error"}`)
      }

      const result = await response.json()
      console.log("Delete ALL response data:", result)

      setDeleteResult({
        success: true,
        message: result.message || "Delete operation started",
        inProgress: true,
        operationId: result.operationId,
      })

      // Initialize progress
      setDeleteProgress({
        inProgress: true,
        total: 0,
        processed: 0,
        percentage: 0,
      })

      // Start polling immediately
      setTimeout(() => {
        console.log(`Immediate poll for delete progress: ${result.operationId}`)
        fetch(`/api/logs/archived/delete/progress?operationId=${result.operationId}`)
          .then((response) => {
            console.log("Immediate poll response status:", response.status)
            if (response.ok) return response.json()
            throw new Error(`API error: ${response.status}`)
          })
          .then((data) => {
            console.log("Immediate poll data:", data)
            if (data) setDeleteProgress(data)
          })
          .catch((error) => console.error("Error in immediate poll:", error))
      }, 500)
    } catch (error: any) {
      console.error("Error deleting all archived logs:", error)
      setIsDeleting(false)
      setDeleteResult({
        success: false,
        message: error.message || "Failed to delete archived logs",
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

            {/* Initial operation started message */}
            {archiveResult && archiveResult.inProgress && (
              <Alert variant="default" className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Operation Started</AlertTitle>
                <AlertDescription>
                  {archiveResult.message}
                  <div className="mt-2 text-sm text-gray-500">Waiting for progress updates...</div>
                </AlertDescription>
              </Alert>
            )}

            {/* Show progress bar if available */}
            {archiveProgress && (
              <div className="space-y-2 mt-4 border p-4 rounded-md bg-gray-50">
                <div className="flex justify-between text-sm font-medium">
                  <span>{archiveProgress.inProgress ? "Archiving logs..." : "Operation complete"}</span>
                  <span>
                    {archiveProgress.processed} of {archiveProgress.total} ({archiveProgress.percentage}%)
                  </span>
                </div>
                <Progress value={archiveProgress.percentage} className="h-2" />

                {/* Show completion message */}
                {archiveProgress.completed && (
                  <div className="mt-2 text-sm text-green-600 font-medium">
                    {archiveProgress.message || `Successfully archived ${archiveProgress.processed} logs`}
                  </div>
                )}
              </div>
            )}

            {/* Show error message if operation failed */}
            {archiveResult && !archiveResult.inProgress && !archiveResult.success && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{archiveResult.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delete Archived Logs</CardTitle>
            <CardDescription>
              Permanently delete archived logs that are no longer needed. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Delete archived logs older than:</div>
              <div className="flex flex-wrap gap-2 items-center">
                <Input
                  type="number"
                  min="1"
                  value={deleteBeforeDate}
                  onChange={(e) => setDeleteBeforeDate(Number.parseInt(e.target.value) || 0)}
                  className="w-24"
                />
                <span className="text-sm">days ago</span>

                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleDeleteDaysPreset(90)}>
                    90 days
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteDaysPreset(180)}>
                    180 days
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteDaysPreset(365)}>
                    365 days
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleDeleteArchivedLogs}
                disabled={isDeleting || deleteBeforeDate <= 0}
                variant="destructive"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Logs
                  </>
                )}
              </Button>

              <Button
                onClick={handleDeleteAllArchivedLogs}
                disabled={isDeleting}
                variant="destructive"
                className="bg-red-700 hover:bg-red-800"
              >
                Delete All Archived Logs
              </Button>
            </div>

            {/* Initial operation started message */}
            {deleteResult && deleteResult.inProgress && (
              <Alert variant="default" className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Operation Started</AlertTitle>
                <AlertDescription>
                  {deleteResult.message}
                  <div className="mt-2 text-sm text-gray-500">Waiting for progress updates...</div>
                </AlertDescription>
              </Alert>
            )}

            {/* Show progress bar if available */}
            {deleteProgress && (
              <div className="space-y-2 mt-4 border p-4 rounded-md bg-gray-50">
                <div className="flex justify-between text-sm font-medium">
                  <span>{deleteProgress.inProgress ? "Deleting logs..." : "Operation complete"}</span>
                  <span>
                    {deleteProgress.processed} of {deleteProgress.total} ({deleteProgress.percentage}%)
                  </span>
                </div>
                <Progress value={deleteProgress.percentage} className="h-2" />

                {/* Show completion message */}
                {deleteProgress.completed && (
                  <div className="mt-2 text-sm text-green-600 font-medium">
                    {deleteProgress.message || `Successfully deleted ${deleteProgress.processed} archived logs`}
                  </div>
                )}
              </div>
            )}

            {/* Show error message if operation failed */}
            {deleteResult && !deleteResult.inProgress && !deleteResult.success && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{deleteResult.message}</AlertDescription>
              </Alert>
            )}

            {/* Debug info */}
            {process.env.NODE_ENV !== "production" && deleteResult?.operationId && (
              <div className="mt-4 p-2 border border-gray-200 rounded text-xs text-gray-500">
                <div>Operation ID: {deleteResult.operationId}</div>
                <div>Poll Count: {deletePollCount}</div>
                <div>Progress: {JSON.stringify(deleteProgress)}</div>
              </div>
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
