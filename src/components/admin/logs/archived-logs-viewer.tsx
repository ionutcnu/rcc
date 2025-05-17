"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import {
  Loader2,
  RefreshCw,
  Search,
  AlertCircle,
  Info,
  AlertTriangle,
  Cat,
  Clock,
  Trash2,
  Database,
  Calendar,
} from "lucide-react"
import type { LogEntry } from "@/lib/types"

// Number of logs to load at once
const PAGE_SIZE = 25

export function ArchivedLogsViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "info" | "warn" | "error" | "cat-activity">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [actionTypeFilter, setActionTypeFilter] = useState<string | null>(null)
  const [deleteDate, setDeleteDate] = useState<Date | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteResult, setDeleteResult] = useState<{
    success: boolean
    message: string
    deleted?: number
    hasMore?: boolean
  } | null>(null)
  const [popupMessage, setPopupMessage] = useState<string | null>(null)
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [useCache, setUseCache] = useState(true)
  const [oldestLogDate, setOldestLogDate] = useState<Date | null>(null)
  const [deleteAll, setDeleteAll] = useState(false)
  const [logsLoaded, setLogsLoaded] = useState(false)
  const [levelFilter, setLevelFilter] = useState<"all" | "info" | "warn" | "error">("all")
  const [activeTab, setActiveTab] = useState<"all" | "system" | "cat-activity">("all")

  // Format date for display
  const formatDate = (date?: Date | null) => (date ? format(date, "MMM d, yyyy") : "")

  // Show popup message
  const showPopup = (message: string) => {
    setPopupMessage(message)
    setTimeout(() => {
      setPopupMessage(null)
    }, 3000)
  }

  // Validate date range
  const validateDateRange = useCallback(() => {
    const now = new Date()

    // Don't allow future dates
    if (startDate && startDate > now) {
      setStartDate(now)
      showPopup("Start date cannot be in the future")
      return false
    }

    if (endDate && endDate > now) {
      setEndDate(now)
      showPopup("End date cannot be in the future")
      return false
    }

    // Make sure start date is before end date
    if (startDate && endDate && startDate > endDate) {
      setEndDate(startDate)
      showPopup("End date must be after start date")
      return false
    }

    return true
  }, [startDate, endDate])

  // Update filter based on tab and level selections
  useEffect(() => {
    // Set the filter based on active tab and level filter
    if (activeTab === "cat-activity") {
      setFilter("cat-activity")
    } else if (activeTab === "system") {
      setFilter("info")
    } else {
      // All logs tab - apply level filter
      setFilter(levelFilter)
    }
  }, [activeTab, levelFilter])

  // Fetch archived logs
  const fetchArchivedLogs = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true)
      } else if (refreshing) {
        // Already refreshing, no need to set loading state
      } else {
        setRefreshing(true)
      }

      setError(null)
      setCursor(null)
      setHasMore(true)

      // If it's initial load and we don't want to load logs yet, just return
      if (isInitialLoad && !logsLoaded) {
        setLoading(false)
        return
      }

      // Build API URL with filters
      const params = new URLSearchParams({
        pageSize: PAGE_SIZE.toString(),
        filter,
        skipCache: (!useCache).toString(),
      })

      if (startDate) params.append("startDate", startOfDay(startDate).toISOString())
      if (endDate) params.append("endDate", endOfDay(endDate).toISOString())
      if (actionTypeFilter) params.append("actionType", actionTypeFilter)
      if (debouncedSearchQuery) params.append("search", debouncedSearchQuery)

      console.log("Fetching archived logs with params:", Object.fromEntries(params.entries()))

      const response = await fetch(`/api/logs/archived?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`API error: ${response.status} - ${errorData.error || "Unknown error"}`)
      }

      const data = await response.json()
      console.log("Archived logs response:", data)

      if (data.logs) {
        const fetchedLogs = data.logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
          archivedAt: log.archivedAt ? new Date(log.archivedAt) : null,
        }))

        setLogs(fetchedLogs)
        setCursor(data.cursor)
        setHasMore(data.hasMore)
        setLogsLoaded(true)

        // Find oldest log date for deletion reference
        if (fetchedLogs.length > 0 && (!oldestLogDate || isInitialLoad)) {
          // Sort by timestamp ascending to find the oldest
          const sortedLogs = [...fetchedLogs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
          setOldestLogDate(sortedLogs[0].timestamp)
        }
      } else {
        setLogs([])
        setHasMore(false)
      }
    } catch (error: any) {
      console.error("Error fetching archived logs:", error)
      setError(error.message || "Failed to fetch archived logs")
    } finally {
      setLoading(false)
      setRefreshing(false)
      if (isInitialLoad) {
        setInitialLoadDone(true)
      }
    }
  }

  // Load more logs for pagination
  const loadMoreLogs = async () => {
    if (!cursor || loadingMore) return

    try {
      setLoadingMore(true)

      // Build API URL with filters and cursor
      const params = new URLSearchParams({
        pageSize: PAGE_SIZE.toString(),
        cursor,
        filter,
        skipCache: (!useCache).toString(),
      })

      if (startDate) params.append("startDate", startOfDay(startDate).toISOString())
      if (endDate) params.append("endDate", endOfDay(endDate).toISOString())
      if (actionTypeFilter) params.append("actionType", actionTypeFilter)
      if (debouncedSearchQuery) params.append("search", debouncedSearchQuery)

      const response = await fetch(`/api/logs/archived?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.logs) {
        const moreLogs = data.logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
          archivedAt: log.archivedAt ? new Date(log.archivedAt) : null,
        }))

        // Append new logs to existing logs
        setLogs((prevLogs) => [...prevLogs, ...moreLogs])
        setCursor(data.cursor)
        setHasMore(data.hasMore)

        // Update oldest log date if needed
        if (moreLogs.length > 0) {
          const sortedLogs = [...moreLogs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
          if (!oldestLogDate || sortedLogs[0].timestamp < oldestLogDate) {
            setOldestLogDate(sortedLogs[0].timestamp)
          }
        }
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error("Error loading more archived logs:", error)
    } finally {
      setLoadingMore(false)
    }
  }

  // Handle refresh
  const handleRefresh = () => {
    fetchArchivedLogs(false)
  }

  // Delete archived logs
  const deleteArchivedLogs = async () => {
    if (!deleteDate && !deleteAll) {
      setDeleteResult({
        success: false,
        message: "Please select a date first or choose to delete all logs",
      })
      return
    }

    try {
      setIsDeleting(true)
      setDeleteResult(null)

      const requestBody: any = {
        batchSize: 100,
        deleteAll,
      }

      if (!deleteAll && deleteDate) {
        requestBody.beforeDate = startOfDay(deleteDate).toISOString()
        console.log(`Deleting logs older than: ${requestBody.beforeDate}`)
      } else {
        console.log("Deleting ALL archived logs")
      }

      const response = await fetch("/api/logs/archived/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`API error: ${response.status} - ${errorData.error || "Unknown error"}`)
      }

      const result = await response.json()
      console.log("Delete result:", result)

      setDeleteResult({
        success: true,
        message: result.message || `Successfully deleted ${result.deleted} archived logs`,
        deleted: result.deleted,
        hasMore: result.hasMore,
      })

      // If there are more logs to delete, show a message
      if (result.hasMore) {
        setDeleteResult((prev) => ({
          ...prev!,
          message: `${prev!.message}. There are more logs to delete. Run the operation again.`,
        }))
      }

      // Refresh the logs list
      fetchArchivedLogs(false)
    } catch (error: any) {
      console.error("Error deleting archived logs:", error)
      setDeleteResult({
        success: false,
        message: error.message || "Failed to delete archived logs",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchArchivedLogs(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch when filters change (but not on initial load)
  useEffect(() => {
    if (initialLoadDone && logsLoaded && validateDateRange()) {
      fetchArchivedLogs(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, startDate, endDate, actionTypeFilter, debouncedSearchQuery, initialLoadDone, logsLoaded])

  // Add this useEffect for debouncing search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Clear all filters
  const clearFilters = () => {
    setStartDate(null)
    setEndDate(null)
    setLevelFilter("all")
    setActionTypeFilter(null)
    setSearchQuery("")
  }

  // Set predefined date ranges
  const setLastDay = () => {
    const today = new Date()
    setStartDate(subDays(today, 1))
    setEndDate(today)
  }

  const setLastWeek = () => {
    const today = new Date()
    setStartDate(subDays(today, 7))
    setEndDate(today)
  }

  const setLastMonth = () => {
    const today = new Date()
    setStartDate(subDays(today, 30))
    setEndDate(today)
  }

  // Set predefined delete date ranges
  const setDeleteLastMonth = () => {
    const today = new Date()
    setDeleteDate(subDays(today, 30))
    setDeleteAll(false)
  }

  const setDeleteLastThreeMonths = () => {
    const today = new Date()
    setDeleteDate(subDays(today, 90))
    setDeleteAll(false)
  }

  const setDeleteLastSixMonths = () => {
    const today = new Date()
    setDeleteDate(subDays(today, 180))
    setDeleteAll(false)
  }

  // Set delete date to oldest log date
  const setDeleteToOldestLog = () => {
    if (oldestLogDate) {
      // Add 1 day to make sure we include the oldest log
      const date = new Date(oldestLogDate)
      date.setDate(date.getDate() + 1)
      setDeleteDate(date)
      setDeleteAll(false)
    } else {
      showPopup("No logs available to determine oldest date")
    }
  }

  // Toggle delete all mode
  const toggleDeleteAll = () => {
    setDeleteAll(!deleteAll)
    if (!deleteAll) {
      setDeleteDate(null)
    }
  }

  // Get icon for log level
  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "warn":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  // Format date
  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date)
  }

  // Enhanced function to display user information
  const formatUserInfo = (log: LogEntry) => {
    // First check if email is in the details object (our new approach)
    if (log.details?.userEmail) {
      return (
        <div className="text-xs text-gray-500 mt-2">
          User: {log.details.userEmail}
          {log.userId && <span className="ml-1 text-gray-400">({log.userId.substring(0, 8)}...)</span>}
        </div>
      )
    }
    // Then check if email is directly in the log entry (our previous approach)
    else if (log.userEmail) {
      return (
        <div className="text-xs text-gray-500 mt-2">
          User: {log.userEmail}
          {log.userId && <span className="ml-1 text-gray-400">({log.userId.substring(0, 8)}...)</span>}
        </div>
      )
    }
    // Fall back to just showing the user ID
    else if (log.userId) {
      return <div className="text-xs text-gray-500 mt-2">User ID: {log.userId}</div>
    }
    return null
  }

  // Action type mapping for better display
  const actionTypeLabels: Record<string, { label: string; color: string }> = {
    add: { label: "Added", color: "bg-green-100 text-green-800" },
    update: { label: "Updated", color: "bg-blue-100 text-blue-800" },
    delete: { label: "Deleted", color: "bg-red-100 text-red-800" },
    upload: { label: "Uploaded", color: "bg-purple-100 text-purple-800" },
    archive: { label: "Archived", color: "bg-amber-100 text-amber-800" },
    restore: { label: "Restored", color: "bg-emerald-100 text-emerald-800" },
    system: { label: "System", color: "bg-gray-100 text-gray-800" },
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Archived Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Filters */}
            <div className="space-y-4">
              {/* Tab filters */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex flex-col space-y-4">
                  <div className="flex space-x-2 border-b pb-2">
                    <button
                      className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                        activeTab === "all" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab("all")}
                    >
                      All Logs
                    </button>
                    <button
                      className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                        activeTab === "system" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab("system")}
                    >
                      System
                    </button>
                    <button
                      className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                        activeTab === "cat-activity" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                      }`}
                      onClick={() => setActiveTab("cat-activity")}
                    >
                      Cat Activity
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search archived logs..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Date Range
                      </Button>

                      <Select
                        value={levelFilter}
                        onValueChange={(value: "all" | "info" | "warn" | "error") => setLevelFilter(value)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="All Levels" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warn">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex items-center ml-2">
                        <input
                          type="checkbox"
                          id="useCache"
                          checked={useCache}
                          onChange={(e) => setUseCache(e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor="useCache" className="text-sm flex items-center">
                          <Database className="h-3 w-3 mr-1" />
                          Use cache
                        </label>
                      </div>

                      {!logsLoaded ? (
                        <Button
                          onClick={() => {
                            setLogsLoaded(true)
                            fetchArchivedLogs(false)
                          }}
                          className="ml-auto"
                        >
                          <Database className="h-4 w-4 mr-2" />
                          Fetch Logs
                        </Button>
                      ) : (
                        <Button onClick={handleRefresh} disabled={refreshing} className="ml-auto">
                          {refreshing ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Refresh
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Show active filters */}
            {(startDate ||
              endDate ||
              levelFilter !== "all" ||
              activeTab !== "all" ||
              actionTypeFilter ||
              searchQuery) && (
              <div className="flex flex-wrap gap-2">
                <div className="text-sm text-gray-500 mr-2">Active filters:</div>
                {(startDate || endDate) && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {startDate && endDate
                      ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                      : startDate
                        ? `From ${formatDate(startDate)}`
                        : endDate
                          ? `Until ${formatDate(endDate)}`
                          : ""}
                  </Badge>
                )}
                {activeTab !== "all" && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {activeTab === "cat-activity" ? "Cat Activity" : "System"}
                  </Badge>
                )}
                {levelFilter !== "all" && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Level: {levelFilter}
                  </Badge>
                )}
                {actionTypeFilter && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {actionTypeLabels[actionTypeFilter]?.label || actionTypeFilter}
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    "{searchQuery}"
                  </Badge>
                )}
                {!useCache && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50">
                    <Database className="h-3 w-3 mr-1" />
                    Cache disabled
                  </Badge>
                )}
              </div>
            )}

            {/* Popup message */}
            {popupMessage && (
              <Alert variant="default">
                <Info className="h-4 w-4" />
                <AlertTitle>Info</AlertTitle>
                <AlertDescription>{popupMessage}</AlertDescription>
              </Alert>
            )}

            {/* Error message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Logs content */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <span className="ml-2">Loading archived logs...</span>
              </div>
            ) : !logsLoaded ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Database className="h-12 w-12 mb-4 text-gray-400" />
                <p>Click "Fetch Logs" to load archived logs</p>
                <p className="text-sm mt-2">No database queries will be made until you request logs</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No archived logs found matching your criteria.</div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-md border ${
                      log.level === "error"
                        ? "bg-red-50 border-red-200"
                        : log.level === "warn"
                          ? "bg-amber-50 border-amber-200"
                          : log.actionType
                            ? "bg-orange-50 border-orange-200"
                            : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {log.actionType ? <Cat className="h-4 w-4 text-orange-500 mr-2" /> : getLevelIcon(log.level)}
                        <span className="ml-2 font-medium">{log.message}</span>

                        {log.actionType && (
                          <span
                            className={`ml-2 text-xs px-2 py-0.5 rounded ${
                              actionTypeLabels[log.actionType]?.color || "bg-gray-100"
                            }`}
                          >
                            {actionTypeLabels[log.actionType]?.label || log.actionType}
                          </span>
                        )}

                        {!log.actionType && (
                          <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {log.level}
                          </span>
                        )}

                        {log.catName && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            {log.catName}
                          </span>
                        )}

                        {log.archivedAt && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                            Archived: {formatDate(log.archivedAt)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>

                    {/* Collapsible details section */}
                    <details className="mt-2">
                      <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                        View details
                      </summary>
                      <div className="mt-2 pl-2 border-l-2 border-gray-200">
                        {log.details && (
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto mt-2">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}

                        {formatUserInfo(log)}

                        {log.catId && <div className="text-xs text-gray-500 mt-2">Cat ID: {log.catId}</div>}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}

            {/* Load more button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={loadMoreLogs} disabled={loadingMore} className="w-full max-w-xs">
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading more...
                    </>
                  ) : (
                    "Load more logs"
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Permanent Deletion Card */}
      <Card className="border-red-200">
        <CardHeader className="bg-red-50 border-b border-red-200">
          <CardTitle className="text-red-800">Permanent Deletion</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-md border border-red-200">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                <div>
                  <h3 className="font-medium text-red-800">Warning: Permanent Deletion</h3>
                  <p className="text-sm text-red-700 mt-1">
                    This action will permanently delete archived logs. This operation cannot be undone. Please ensure
                    you have exported any logs you wish to keep.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div>
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="deleteAll"
                    checked={deleteAll}
                    onChange={toggleDeleteAll}
                    className="mr-2"
                  />
                  <label htmlFor="deleteAll" className="text-sm font-medium text-red-700 flex items-center">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete ALL archived logs
                  </label>
                </div>

                {!deleteAll && (
                  <>
                    <label className="block text-sm font-medium mb-1">Delete archived logs older than:</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Days ago"
                        className="w-24"
                        value={
                          deleteDate
                            ? Math.round((new Date().getTime() - deleteDate.getTime()) / (1000 * 60 * 60 * 24))
                            : ""
                        }
                        onChange={(e) => {
                          const days = Number.parseInt(e.target.value)
                          if (!isNaN(days) && days > 0) {
                            setDeleteDate(subDays(new Date(), days))
                          } else {
                            setDeleteDate(null)
                          }
                        }}
                      />
                      <span className="text-sm flex items-center">days ago</span>

                      <div className="flex gap-2 ml-2">
                        <Button variant="outline" size="sm" onClick={setDeleteLastMonth}>
                          30 days
                        </Button>
                        <Button variant="outline" size="sm" onClick={setDeleteLastThreeMonths}>
                          90 days
                        </Button>
                        <Button variant="outline" size="sm" onClick={setDeleteLastSixMonths}>
                          180 days
                        </Button>
                        {oldestLogDate && (
                          <Button variant="outline" size="sm" onClick={setDeleteToOldestLog}>
                            <Calendar className="h-3 w-3 mr-1" />
                            All logs
                          </Button>
                        )}
                      </div>
                    </div>
                    {deleteDate && (
                      <div className="mt-2 text-sm text-gray-500">
                        Will delete logs before: <span className="font-medium">{formatDate(deleteDate)}</span>
                      </div>
                    )}
                    {oldestLogDate && (
                      <div className="mt-1 text-xs text-gray-500">Oldest log date: {formatDate(oldestLogDate)}</div>
                    )}
                  </>
                )}
              </div>

              <Button
                onClick={deleteArchivedLogs}
                disabled={isDeleting || (!deleteDate && !deleteAll)}
                variant="destructive"
                className="mt-6 md:mt-0"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Permanently
                  </>
                )}
              </Button>
            </div>

            {deleteResult && (
              <Alert variant={deleteResult.success ? "default" : "destructive"}>
                {deleteResult.success ? <Info className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{deleteResult.success ? "Success" : "Error"}</AlertTitle>
                <AlertDescription>{deleteResult.message}</AlertDescription>
                {deleteResult.success && deleteResult.hasMore && (
                  <Button
                    onClick={deleteArchivedLogs}
                    disabled={isDeleting}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Deleting more...
                      </>
                    ) : (
                      "Delete More"
                    )}
                  </Button>
                )}
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ArchivedLogsViewer
