"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Loader2,
    RefreshCw,
    Search,
    AlertCircle,
    Info,
    AlertTriangle,
    ExternalLink,
    Cat,
    CalendarIcon,
    Clock,
    ChevronLeft,
    ChevronRight,
    Download,
    FileText,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, subDays, isBefore, isAfter, startOfDay, endOfDay, isValid } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { LogEntry, DateRange as DateRangeType } from "@/lib/types"
import { ArchiveLogsTab } from "@/components/admin/logs/archive-logs-tab"
import { LogStats } from "@/components/admin/log-stats"

// Number of logs to load at once - reduced from 25 to 10
const PAGE_SIZE = 10

export default function LogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [loading, setLoading] = useState(false)
    const [filter, setFilter] = useState<"all" | "info" | "warn" | "error" | "cat-activity">("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [indexUrl, setIndexUrl] = useState<string | null>(null)
    const [cursor, setCursor] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [startDate, setStartDate] = useState<Date | null>(null)
    const [endDate, setEndDate] = useState<Date | null>(null)
    const [isStartDateOpen, setIsStartDateOpen] = useState(false)
    const [isEndDateOpen, setIsEndDateOpen] = useState(false)
    const [actionTypeFilter, setActionTypeFilter] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState("all")
    const [logStats, setLogStats] = useState({
        total: 0,
        info: 0,
        warn: 0,
        error: 0,
        catActivity: 0,
        other: 0,
    })
    const [initialLoad, setInitialLoad] = useState(true)
    const [exporting, setExporting] = useState(false)
    const [useCache, setUseCache] = useState(true)
    const [logsLoaded, setLogsLoaded] = useState(false)
    const [mainTabsValue, setMainTabsValue] = useState("logs")

    // Format date for display
    const formatDate = (date?: Date | null) => (date && isValid(date) ? format(date, "MMM d, yyyy") : "")

    // Create date range string for display
    const dateRangeText = startDate ? (
      endDate ? (
        <>
            From <time dateTime={startDate.toISOString()}>{formatDate(startDate)}</time> to{" "}
            <time dateTime={endDate.toISOString()}>{formatDate(endDate)}</time>
        </>
      ) : (
        <>
            From <time dateTime={startDate.toISOString()}>{formatDate(startDate)}</time>
        </>
      )
    ) : (
      "Select date range"
    )

    // Convert DateRange to DateRangeType for query
    const getQueryDateRange = useCallback((): DateRangeType => {
        return {
            startDate: startDate,
            endDate: endDate,
        }
    }, [startDate, endDate])

    // Validate date range
    const validateDateRange = useCallback(() => {
        const now = new Date()

        // Don't allow future dates
        if (startDate && isAfter(startDate, now)) {
            setStartDate(now)
            showPopup("Start date cannot be in the future")
            return false
        }

        if (endDate && isAfter(endDate, now)) {
            setEndDate(now)
            showPopup("End date cannot be in the future")
            return false
        }

        // Make sure start date is before end date
        if (startDate && endDate && isAfter(startDate, endDate)) {
            setEndDate(startDate)
            showPopup("End date must be after start date")
            return false
        }

        return true
    }, [startDate, endDate])

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            // Build API URL with filters
            const params = new URLSearchParams({
                filter,
                pageSize: PAGE_SIZE.toString(),
                skipCache: (!useCache).toString(),
                tab: activeTab, // Add the active tab to the request
            })

            if (cursor) params.append("cursor", cursor)
            if (startDate) params.append("startDate", startOfDay(startDate).toISOString())
            if (endDate) params.append("endDate", endOfDay(endDate).toISOString())
            if (actionTypeFilter) params.append("actionType", actionTypeFilter)
            if (searchQuery) params.append("search", searchQuery)

            try {
                const response = await fetch(`/api/logs?${params.toString()}`)

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    throw new Error(`API error: ${response.status} - ${errorData.error || "Unknown error"}`)
                }

                const data = await response.json()

                if (data.logs) {
                    const fetchedLogs = data.logs.map((log: any) => ({
                        ...log,
                        timestamp: new Date(log.timestamp),
                    }))

                    // If we already have logs and this is a "load more" operation, append
                    if (cursor) {
                        setLogs((prevLogs) => [...prevLogs, ...fetchedLogs])
                    } else {
                        // Otherwise this is a fresh load
                        setLogs(fetchedLogs)
                    }

                    setCursor(data.cursor)
                    setHasMore(data.hasMore)
                    setLogsLoaded(true)
                } else {
                    if (!cursor) {
                        // Only clear logs if this is a fresh load
                        setLogs([])
                    }
                    setHasMore(false)
                    setLogsLoaded(true)
                }
            } catch (error: any) {
                console.error("Error fetching logs:", error)
                setError(error?.message || "Failed to fetch logs")
            }
        } finally {
            setLoading(false)
        }
    }, [cursor, filter, startDate, endDate, actionTypeFilter, searchQuery, activeTab, useCache])

    // Reset logs when filters change (but don't auto-fetch)
    useEffect(() => {
        if (!initialLoad) {
            // Reset logs state when filters change
            setLogs([])
            setCursor(null)
            setHasMore(true)
            setLogsLoaded(false)
        }
    }, [filter, startDate, endDate, actionTypeFilter, searchQuery, activeTab, initialLoad])

    // Load more logs for pagination
    const loadMoreLogs = async () => {
        if (!cursor || loadingMore) return

        try {
            setLoadingMore(true)
            await fetchLogs()
        } finally {
            setLoadingMore(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        // Reset logs data
        setLogs([])
        setCursor(null)
        setHasMore(true)
        setLogsLoaded(false)

        // Refresh stats only
        await fetchLogStats()
        setRefreshing(false)
    }

    // Clear all filters
    const clearFilters = () => {
        setStartDate(null)
        setEndDate(null)
        setFilter("all")
        setActionTypeFilter(null)
        setSearchQuery("")

        // Clear logs when filters change
        setLogs([])
        setCursor(null)
        setHasMore(true)
        setLogsLoaded(false)
    }

    // Set predefined date ranges
    const setLastDay = () => {
        const today = new Date()
        setStartDate(subDays(today, 1))
        setEndDate(today)
        setIsStartDateOpen(false)
        setIsEndDateOpen(false)
    }

    const setLastWeek = () => {
        const today = new Date()
        setStartDate(subDays(today, 7))
        setEndDate(today)
        setIsStartDateOpen(false)
        setIsEndDateOpen(false)
    }

    const setLastMonth = () => {
        const today = new Date()
        setStartDate(subDays(today, 30))
        setEndDate(today)
        setIsStartDateOpen(false)
        setIsEndDateOpen(false)
    }

    const exportLogsToCSV = () => {
        try {
            // Build API URL with filters
            const { startDate, endDate } = getQueryDateRange()
            const params = new URLSearchParams({
                filter,
            })

            if (startDate) params.append("startDate", startOfDay(startDate).toISOString())
            if (endDate) params.append("endDate", endOfDay(endDate).toISOString())
            if (actionTypeFilter) params.append("actionType", actionTypeFilter)
            if (searchQuery) params.append("search", searchQuery)

            // Use window.open to trigger the download
            window.open(`/api/logs/export?${params.toString()}`, "_blank")
        } catch (error) {
            console.error("Error exporting logs:", error)
            showPopup("Failed to export logs")
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

    const fixLogLevels = async () => {
        try {
            setRefreshing(true)
            const response = await fetch("/api/logs/fix-levels")
            const data = await response.json()
            if (data.success) {
                showPopup(`Fixed ${data.updated} log levels`)
                handleRefresh()
            } else {
                showPopup(`Error: ${data.error}`)
            }
        } catch (error) {
            console.error("Error fixing log levels:", error)
            showPopup("Failed to fix log levels")
        } finally {
            setRefreshing(false)
        }
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
        // Fall back to showing email from details or user ID
        else if (log.userId) {
            // Check if email is available in details
            const emailFromDetails = log.details?.email || log.details?.userEmail
            if (emailFromDetails) {
                return (
                    <div className="text-xs text-gray-500 mt-2">
                        User: {emailFromDetails}
                        <span className="ml-1 text-gray-400">({log.userId.substring(0, 8)}...)</span>
                    </div>
                )
            }
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

    const [popupMessage, setPopupMessage] = useState<string | null>(null)

    const showPopup = (message: string) => {
        setPopupMessage(message)
        setTimeout(() => {
            setPopupMessage(null)
        }, 3000)
    }

    // Fetch log stats - separate function to avoid duplicate calls
    const fetchLogStats = useCallback(async () => {
        try {
            const params = new URLSearchParams({
                skipCache: (!useCache).toString(),
            })

            if (startDate) params.append("startDate", startOfDay(startDate).toISOString())
            if (endDate) params.append("endDate", endOfDay(endDate).toISOString())
            if (filter !== "all") params.append("filter", filter)

            const response = await fetch(`/api/logs/stats?${params.toString()}`)

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`)
            }

            const data = await response.json()

            if (data.stats) {
                setLogStats(data.stats)
                return data.stats
            }

            // Fallback to client-side stats calculation
            const fallbackStats = {
                total: logs.length,
                info: logs.filter((log) => log.level === "info").length,
                warn: logs.filter((log) => log.level === "warn").length,
                error: logs.filter((log) => log.level === "error").length,
                catActivity: logs.filter((log) => log.actionType).length,
                other: logs.filter((log) => !["info", "warn", "error"].includes(log.level) && !log.actionType).length,
            }
            setLogStats(fallbackStats)
            return fallbackStats
        } catch (error) {
            console.error("Error fetching log stats:", error)
            // Fallback to client-side stats calculation
            const fallbackStats = {
                total: logs.length,
                info: logs.filter((log) => log.level === "info").length,
                warn: logs.filter((log) => log.level === "warn").length,
                error: logs.filter((log) => log.level === "error").length,
                catActivity: logs.filter((log) => log.actionType).length,
                other: logs.filter((log) => !["info", "warn", "error"].includes(log.level) && !log.actionType).length,
            }
            setLogStats(fallbackStats)
            return fallbackStats
        }
    }, [startDate, endDate, filter, useCache, logs])

    // Only fetch stats on initial load, not logs
    useEffect(() => {
        if (initialLoad) {
            fetchLogStats()
            setInitialLoad(false)
        }
    }, [initialLoad, fetchLogStats])

    // Handle tab change
    const handleTabChange = (value: string) => {
        setActiveTab(value)

        // If switching to Cat Activity tab, set filter to cat-activity
        if (value === "catActivity") {
            setFilter("cat-activity")
        }

        // Reset logs when changing tabs (but don't auto-fetch)
        setLogs([])
        setCursor(null)
        setHasMore(true)
        setLogsLoaded(false)
    }

    // Handle date selection
    const handleDateChange = (date: Date | null, type: "start" | "end") => {
        const now = new Date()

        // Don't allow future dates
        if (date && isAfter(date, now)) {
            showPopup(`${type === "start" ? "Start" : "End"} date cannot be in the future`)
            date = now
        }

        if (type === "start") {
            setStartDate(date)
            // If end date is before start date, update end date
            if (date && endDate && isBefore(endDate, date)) {
                setEndDate(date)
            }
            setIsStartDateOpen(false)
            // If no end date is set, open end date picker
            if (date && !endDate) {
                setTimeout(() => setIsEndDateOpen(true), 100)
            }
        } else {
            setEndDate(date)
            setIsEndDateOpen(false)
        }
    }

    // Generate calendar days
    const generateCalendarDays = (year: number, month: number) => {
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const firstDayOfMonth = new Date(year, month, 1).getDay()
        const today = new Date()

        // Create array of day numbers
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

        // Create array for padding days
        const paddingDays = Array(firstDayOfMonth).fill(null)

        return { days, paddingDays, today }
    }

    // Get current month and year for calendar
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())

    // Navigate to previous month
    const goToPrevMonth = () => {
        if (calendarMonth === 0) {
            setCalendarMonth(11)
            setCalendarYear(calendarYear - 1)
        } else {
            setCalendarMonth(calendarMonth - 1)
        }
    }

    // Navigate to next month
    const goToNextMonth = () => {
        if (calendarMonth === 11) {
            setCalendarMonth(0)
            setCalendarYear(calendarYear + 1)
        } else {
            setCalendarMonth(calendarMonth + 1)
        }
    }

    // Check if a date is selected
    const isDateSelected = (date: Date) => {
        if (!startDate && !endDate) return false

        if (startDate && !endDate) {
            return isSameDay(date, startDate)
        }

        if (startDate && endDate) {
            return (
              isSameDay(date, startDate) || isSameDay(date, endDate) || (isAfter(date, startDate) && isBefore(date, endDate))
            )
        }

        return false
    }

    // Check if two dates are the same day
    const isSameDay = (date1: Date, date2: Date) => {
        return (
          date1.getFullYear() === date2.getFullYear() &&
          date1.getMonth() === date2.getMonth() &&
          date1.getDate() === date2.getDate()
        )
    }

    // Get calendar for current month
    const { days, paddingDays, today } = generateCalendarDays(calendarYear, calendarMonth)

    // Format month name
    const monthName = new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(calendarYear, calendarMonth))

    const handleExport = async () => {
        try {
            setExporting(true)

            const params = new URLSearchParams({
                filter,
            })

            if (searchQuery) {
                params.append("search", searchQuery)
            }

            const response = await fetch(`/api/logs/export?${params.toString()}`)

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`)
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.style.display = "none"
            a.href = url
            a.download = `logs-export-${new Date().toISOString().split("T")[0]}.csv`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
        } catch (error: any) {
            console.error("Error exporting logs:", error)
            setError(error?.message || "Failed to export logs")
            showPopup("Failed to export logs")
        } finally {
            setExporting(false)
        }
    }

    return (
      <div className="space-y-6">
          <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">System Logs</h1>
              <div className="flex gap-2">
                  <Button onClick={fetchLogs} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                      {loading ? "Fetching..." : "Fetch Logs"}
                  </Button>
                  <Button variant="outline" onClick={fixLogLevels}>
                      Fix Log Levels
                  </Button>
                  <Button variant="outline" onClick={handleExport} disabled={exporting}>
                      {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                      {exporting ? "Exporting..." : "Export CSV"}
                  </Button>
                  <Button onClick={handleRefresh} disabled={refreshing}>
                      {refreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                      Refresh
                  </Button>
              </div>
          </div>

          {error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error fetching logs</AlertTitle>
                <AlertDescription>
                    {error}
                    {indexUrl && (
                      <div className="mt-2">
                          <a
                            href={indexUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:underline"
                          >
                              Create the required index in Firebase Console
                              <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                      </div>
                    )}
                </AlertDescription>
            </Alert>
          )}

          {popupMessage && (
            <Alert variant="default">
                <Info className="h-4 w-4" />
                <AlertTitle>Info</AlertTitle>
                <AlertDescription>{popupMessage}</AlertDescription>
            </Alert>
          )}

          <LogStats />

          <Tabs defaultValue="logs" value={mainTabsValue} onValueChange={setMainTabsValue}>
              <TabsList className="mb-4">
                  <TabsTrigger value="logs">Log Entries</TabsTrigger>
                  <TabsTrigger value="archive">Archive Management</TabsTrigger>
              </TabsList>

              <TabsContent value="logs">
                  <Card>
                      <CardHeader className="pb-0">
                          <CardTitle>Log Entries</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <Tabs defaultValue="all" className="mt-4" onValueChange={handleTabChange} value={activeTab}>
                              <TabsList className="mb-4">
                                  <TabsTrigger value="all">All Logs</TabsTrigger>
                                  <TabsTrigger value="system">System</TabsTrigger>
                                  <TabsTrigger value="catActivity">Cat Activity</TabsTrigger>
                              </TabsList>

                              {/* Improved filter UI */}
                              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                  <div className="flex flex-col md:flex-row gap-4">
                                      <div className="relative flex-grow">
                                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                          <Input
                                            placeholder="Search logs..."
                                            className="pl-10"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                          />
                                      </div>

                                      <div className="flex flex-wrap gap-2">
                                          {/* Start Date Picker */}
                                          <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                                              <PopoverTrigger asChild>
                                                  <Button variant="outline" className="flex items-center">
                                                      <CalendarIcon className="h-4 w-4 mr-2" />
                                                      {startDate ? formatDate(startDate) : "Start Date"}
                                                  </Button>
                                              </PopoverTrigger>
                                              <PopoverContent className="w-auto p-0" align="start">
                                                  <div className="p-3 border-b">
                                                      <div className="flex justify-between items-center">
                                                          <h4 className="font-medium">Select start date</h4>
                                                          <div className="flex gap-1">
                                                              <Button variant="ghost" size="sm" onClick={setLastDay} className="h-7 text-xs">
                                                                  Last 24h
                                                              </Button>
                                                              <Button variant="ghost" size="sm" onClick={setLastWeek} className="h-7 text-xs">
                                                                  Last 7d
                                                              </Button>
                                                              <Button variant="ghost" size="sm" onClick={setLastMonth} className="h-7 text-xs">
                                                                  Last 30d
                                                              </Button>
                                                          </div>
                                                      </div>
                                                  </div>

                                                  {/* Custom Calendar */}
                                                  <div className="p-3">
                                                      <div className="flex justify-between items-center mb-4">
                                                          <Button variant="ghost" size="sm" onClick={goToPrevMonth}>
                                                              <ChevronLeft className="h-4 w-4" />
                                                          </Button>
                                                          <div className="font-medium">
                                                              {monthName} {calendarYear}
                                                          </div>
                                                          <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                                                              <ChevronRight className="h-4 w-4" />
                                                          </Button>
                                                      </div>

                                                      <div className="grid grid-cols-7 gap-1 text-center">
                                                          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                                                            <div
                                                              key={day}
                                                              className="text-xs font-medium text-gray-500 h-8 flex items-center justify-center"
                                                            >
                                                                {day}
                                                            </div>
                                                          ))}

                                                          {paddingDays.map((_, index) => (
                                                            <div key={`padding-${index}`} className="h-8" />
                                                          ))}

                                                          {days.map((day) => {
                                                              const date = new Date(calendarYear, calendarMonth, day)
                                                              const isToday = isSameDay(date, today)
                                                              const isFuture = isAfter(date, today)
                                                              const isSelected = startDate && isSameDay(date, startDate)

                                                              return (
                                                                <Button
                                                                  key={`day-${day}`}
                                                                  variant={isSelected ? "default" : isToday ? "outline" : "ghost"}
                                                                  className={`h-8 w-8 p-0 ${isFuture ? "text-gray-300" : ""}`}
                                                                  disabled={isFuture}
                                                                  onClick={() => handleDateChange(date, "start")}
                                                                >
                                                                    {day}
                                                                </Button>
                                                              )
                                                          })}
                                                      </div>
                                                  </div>

                                                  <div className="p-3 border-t flex justify-between">
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setStartDate(null)
                                                            setEndDate(null)
                                                            setIsStartDateOpen(false)
                                                        }}
                                                      >
                                                          Clear
                                                      </Button>
                                                      <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => {
                                                            setIsStartDateOpen(false)
                                                        }}
                                                      >
                                                          Apply
                                                      </Button>
                                                  </div>
                                              </PopoverContent>
                                          </Popover>

                                          {/* End Date Picker */}
                                          <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                                              <PopoverTrigger asChild>
                                                  <Button variant="outline" className="flex items-center">
                                                      <CalendarIcon className="h-4 w-4 mr-2" />
                                                      {endDate ? formatDate(endDate) : "End Date"}
                                                  </Button>
                                              </PopoverTrigger>
                                              <PopoverContent className="w-auto p-0" align="start">
                                                  <div className="p-3 border-b">
                                                      <div className="flex justify-between items-center">
                                                          <h4 className="font-medium">Select end date</h4>
                                                          <div className="flex gap-1">
                                                              <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    if (startDate) {
                                                                        setEndDate(startDate)
                                                                        setIsEndDateOpen(false)
                                                                    }
                                                                }}
                                                                className="h-7 text-xs"
                                                              >
                                                                  Same as start
                                                              </Button>
                                                              <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setEndDate(new Date())
                                                                    setIsEndDateOpen(false)
                                                                }}
                                                                className="h-7 text-xs"
                                                              >
                                                                  Today
                                                              </Button>
                                                          </div>
                                                      </div>
                                                  </div>

                                                  {/* Custom Calendar */}
                                                  <div className="p-3">
                                                      <div className="flex justify-between items-center mb-4">
                                                          <Button variant="ghost" size="sm" onClick={goToPrevMonth}>
                                                              <ChevronLeft className="h-4 w-4" />
                                                          </Button>
                                                          <div className="font-medium">
                                                              {monthName} {calendarYear}
                                                          </div>
                                                          <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                                                              <ChevronRight className="h-4 w-4" />
                                                          </Button>
                                                      </div>

                                                      <div className="grid grid-cols-7 gap-1 text-center">
                                                          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                                                            <div
                                                              key={day}
                                                              className="text-xs font-medium text-gray-500 h-8 flex items-center justify-center"
                                                            >
                                                                {day}
                                                            </div>
                                                          ))}

                                                          {paddingDays.map((_, index) => (
                                                            <div key={`padding-${index}`} className="h-8" />
                                                          ))}

                                                          {days.map((day) => {
                                                              const date = new Date(calendarYear, calendarMonth, day)
                                                              const isToday = isSameDay(date, today)
                                                              const isFuture = isAfter(date, today)
                                                              const isSelected = endDate && isSameDay(date, endDate)
                                                              const isTooEarly = startDate && isBefore(date, startDate)

                                                              return (
                                                                <Button
                                                                  key={`day-${day}`}
                                                                  variant={isSelected ? "default" : isToday ? "outline" : "ghost"}
                                                                  className={`h-8 w-8 p-0 ${isFuture || isTooEarly ? "text-gray-300" : ""}`}
                                                                  disabled={!!(isFuture || isTooEarly)}
                                                                  onClick={() => handleDateChange(date, "end")}
                                                                >
                                                                    {day}
                                                                </Button>
                                                              )
                                                          })}
                                                      </div>
                                                  </div>

                                                  <div className="p-3 border-t flex justify-between">
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEndDate(null)
                                                            setIsEndDateOpen(false)
                                                        }}
                                                      >
                                                          Clear
                                                      </Button>
                                                      <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => {
                                                            setIsEndDateOpen(false)
                                                        }}
                                                      >
                                                          Apply
                                                      </Button>
                                                  </div>
                                              </PopoverContent>
                                          </Popover>

                                          {activeTab === "catActivity" && (
                                            <Select
                                              value={actionTypeFilter || "all"}
                                              onValueChange={(value) => setActionTypeFilter(value === "all" ? null : value)}
                                            >
                                                <SelectTrigger className="w-[150px]">
                                                    <SelectValue placeholder="Action Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Actions</SelectItem>
                                                    <SelectItem value="add">Added</SelectItem>
                                                    <SelectItem value="update">Updated</SelectItem>
                                                    <SelectItem value="delete">Deleted</SelectItem>
                                                    <SelectItem value="upload">Uploaded</SelectItem>
                                                    <SelectItem value="archive">Archived</SelectItem>
                                                    <SelectItem value="restore">Restored</SelectItem>
                                                </SelectContent>
                                            </Select>
                                          )}

                                          {/* Log Levels Dropdown */}
                                          <Select
                                            value={filter}
                                            onValueChange={(value: "all" | "info" | "warn" | "error" | "cat-activity") => {
                                                setFilter(value)
                                            }}
                                          >
                                              <SelectTrigger className="w-[150px]">
                                                  <SelectValue placeholder="All Levels" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                  <SelectItem value="all">All Levels</SelectItem>
                                                  <SelectItem value="info">Info</SelectItem>
                                                  <SelectItem value="warn">Warning</SelectItem>
                                                  <SelectItem value="error">Error</SelectItem>
                                              </SelectContent>
                                          </Select>

                                          {/* Add cache control checkbox */}
                                          <div className="flex items-center ml-2">
                                              <input
                                                type="checkbox"
                                                id="useCache"
                                                checked={useCache}
                                                onChange={(e) => setUseCache(e.target.checked)}
                                                className="mr-2"
                                              />
                                              <label htmlFor="useCache" className="text-sm">
                                                  Use cache
                                              </label>
                                          </div>

                                          {(startDate || endDate || filter !== "all" || actionTypeFilter || searchQuery) && (
                                            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
                                                Clear filters
                                            </Button>
                                          )}
                                      </div>
                                  </div>
                              </div>

                              {/* Show active filters */}
                              {(startDate || endDate || filter !== "all" || actionTypeFilter || searchQuery) && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <div className="text-sm text-gray-500 mr-2">Active filters:</div>
                                    {(startDate || endDate) && (
                                      <Badge variant="outline" className="flex items-center gap-1">
                                          <CalendarIcon className="h-3 w-3" />
                                          {startDate && endDate
                                            ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                                            : startDate
                                              ? `From ${formatDate(startDate)}`
                                              : endDate
                                                ? `Until ${formatDate(endDate)}`
                                                : ""}
                                      </Badge>
                                    )}
                                    {filter !== "all" && (
                                      <Badge variant="outline" className="flex items-center gap-1">
                                          <AlertCircle className="h-3 w-3" />
                                          {filter === "cat-activity" ? "Cat Activity" : filter}
                                      </Badge>
                                    )}
                                    {actionTypeFilter && (
                                      <Badge variant="outline" className="flex items-center gap-1">
                                          <Cat className="h-3 w-3" />
                                          {actionTypeLabels[actionTypeFilter]?.label || actionTypeFilter}
                                      </Badge>
                                    )}
                                    {searchQuery && (
                                      <Badge variant="outline" className="flex items-center gap-1">
                                          <Search className="h-3 w-3" />&quot;{searchQuery}&quot;
                                      </Badge>
                                    )}
                                    {!useCache && (
                                      <Badge variant="outline" className="bg-yellow-50">
                                          Cache disabled
                                      </Badge>
                                    )}
                                </div>
                              )}

                              {/* Fetch Logs button */}
                              {!logsLoaded && (
                                <div className="flex justify-center my-8">
                                    <Button onClick={fetchLogs} disabled={loading} size="lg" className="px-8">
                                        {loading ? (
                                          <>
                                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                              Loading...
                                          </>
                                        ) : (
                                          <>
                                              <FileText className="mr-2 h-5 w-5" />
                                              Fetch Logs
                                          </>
                                        )}
                                    </Button>
                                </div>
                              )}

                              <LogsContent
                                logs={
                                    activeTab === "all"
                                      ? logs
                                      : activeTab === "system"
                                        ? logs.filter((log) => !log.actionType)
                                        : logs.filter((log) => log.actionType)
                                }
                                loading={loading}
                                hasMore={hasMore}
                                loadingMore={loadingMore}
                                loadMoreLogs={loadMoreLogs}
                                formatUserInfo={formatUserInfo}
                                getLevelIcon={getLevelIcon}
                                formatDateTime={formatDateTime}
                                actionTypeLabels={actionTypeLabels}
                                logsLoaded={logsLoaded}
                              />
                          </Tabs>
                      </CardContent>
                  </Card>
              </TabsContent>

              <TabsContent value="archive">
                  <ArchiveLogsTab />
              </TabsContent>
          </Tabs>
      </div>
    )
}

// Separate component for rendering logs content
function LogsContent({
                         logs,
                         loading,
                         hasMore,
                         loadingMore,
                         loadMoreLogs,
                         formatUserInfo,
                         getLevelIcon,
                         formatDateTime,
                         actionTypeLabels,
                         logsLoaded,
                     }: {
    logs: LogEntry[]
    loading: boolean
    hasMore: boolean
    loadingMore: boolean
    loadMoreLogs: () => void
    formatUserInfo: (log: LogEntry) => React.ReactNode
    getLevelIcon: (level: string) => React.ReactNode
    formatDateTime: (date: Date) => string
    actionTypeLabels: Record<string, { label: string; color: string }>
    logsLoaded: boolean
}) {
    if (loading) {
        return (
          <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <span className="ml-2">Loading logs...</span>
          </div>
        )
    }

    if (!logsLoaded) {
        return (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Click &quot;Fetch Logs&quot; to load logs with your current filters</p>
          </div>
        )
    }

    if (logs.length === 0) {
        return <div className="text-center py-8 text-gray-500">No logs found matching your criteria.</div>
    }

    return (
      <div>
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
                              <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{log.level}</span>
                            )}

                            {log.catName && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{log.catName}</span>
                            )}
                        </div>
                        <span className="text-xs text-gray-500 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                            {formatDateTime(log.timestamp)}
              </span>
                    </div>

                    {/* Collapsible details section */}
                    <details className="mt-2">
                        <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">View details</summary>
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

          {hasMore && (
            <CardFooter className="flex justify-center pt-4 pb-2">
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
            </CardFooter>
          )}
      </div>
    )
}
