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
    Calendar,
    DownloadCloud,
    Clock,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { DateRange } from "react-day-picker"
import { format, subDays, isSameDay } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { LogEntry, DateRange as DateRangeType } from "@/lib/types"

// REDUCED: Number of logs to load at once
const PAGE_SIZE = 25

export default function LogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<"all" | "info" | "warn" | "error" | "cat-activity">("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [indexUrl, setIndexUrl] = useState<string | null>(null)
    const [cursor, setCursor] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: undefined,
        to: undefined,
    })
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [actionTypeFilter, setActionTypeFilter] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState("all")
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [logStats, setLogStats] = useState({
        total: 0,
        info: 0,
        warn: 0,
        error: 0,
        catActivity: 0,
        other: 0,
    })
    const [initialLoad, setInitialLoad] = useState(true)

    // Format date for display
    const formatDate = (date?: Date) => (date ? format(date, "PPP") : "")

    // Create date range string for display
    const dateRangeText = dateRange?.from ? (
      dateRange.to ? (
        <>
            From <time dateTime={dateRange.from.toISOString()}>{formatDate(dateRange.from)}</time> to{" "}
            <time dateTime={dateRange.to.toISOString()}>{formatDate(dateRange.to)}</time>
        </>
      ) : (
        <>
            From <time dateTime={dateRange.from.toISOString()}>{formatDate(dateRange.from)}</time>
        </>
      )
    ) : (
      "Select a date range"
    )

    // Convert DateRange to DateRangeType for query
    const getQueryDateRange = useCallback((): DateRangeType => {
        return {
            startDate: dateRange?.from || null,
            endDate: dateRange?.to || null,
        }
    }, [dateRange])

    // FIX: Only fetch logs once on initial load and when filters change
    useEffect(() => {
        if (initialLoad) {
            fetchLogs()
            fetchLogStats()
            setInitialLoad(false)
        }
    }, [initialLoad])

    // FIX: Only fetch when filters explicitly change, not on every render
    useEffect(() => {
        if (!initialLoad) {
            fetchLogs()
            fetchLogStats()
        }
    }, [filter, dateRange, actionTypeFilter, searchQuery])

    const fetchLogs = async () => {
        try {
            setLoading(true)
            setError(null)
            setCursor(null)
            setHasMore(true)

            // Build API URL with filters
            const { startDate, endDate } = getQueryDateRange()
            const params = new URLSearchParams({
                filter,
                pageSize: PAGE_SIZE.toString(),
            })

            if (startDate) params.append("startDate", startDate.toISOString())
            if (endDate) params.append("endDate", endDate.toISOString())
            if (actionTypeFilter) params.append("actionType", actionTypeFilter)
            if (searchQuery) params.append("search", searchQuery)

            console.log("Fetching logs with params:", Object.fromEntries(params.entries()))

            try {
                const response = await fetch(`/api/logs?${params.toString()}`)

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    throw new Error(`API error: ${response.status} - ${errorData.error || "Unknown error"}`)
                }

                const data = await response.json()
                console.log("Received logs data:", data)

                if (data.logs) {
                    const fetchedLogs = data.logs.map((log: any) => ({
                        ...log,
                        timestamp: new Date(log.timestamp),
                    }))

                    setLogs(fetchedLogs)
                    setCursor(data.cursor)
                    setHasMore(data.hasMore)
                } else {
                    setLogs([])
                    setHasMore(false)
                }
            } catch (error: any) {
                console.error("Error fetching logs:", error)
                setError(error.message || "Failed to fetch logs")
            }
        } finally {
            setLoading(false)
        }
    }

    // Load more logs for pagination
    const loadMoreLogs = async () => {
        if (!cursor || loadingMore) return

        try {
            setLoadingMore(true)

            // Build API URL with filters and cursor
            const { startDate, endDate } = getQueryDateRange()
            const params = new URLSearchParams({
                filter,
                pageSize: PAGE_SIZE.toString(),
                cursor: cursor,
            })

            if (startDate) params.append("startDate", startDate.toISOString())
            if (endDate) params.append("endDate", endDate.toISOString())
            if (actionTypeFilter) params.append("actionType", actionTypeFilter)
            if (searchQuery) params.append("search", searchQuery)

            const response = await fetch(`/api/logs?${params.toString()}`)

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`)
            }

            const data = await response.json()

            if (data.logs) {
                const moreLogs = data.logs.map((log: any) => ({
                    ...log,
                    timestamp: new Date(log.timestamp),
                }))

                // Append new logs to existing logs
                setLogs((prevLogs) => [...prevLogs, ...moreLogs])
                setCursor(data.cursor)
                setHasMore(data.hasMore)
            } else {
                setHasMore(false)
            }
        } catch (error) {
            console.error("Error loading more logs:", error)
        } finally {
            setLoadingMore(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchLogs()
        await fetchLogStats()
        setRefreshing(false)
    }

    // Clear all filters
    const clearFilters = () => {
        setDateRange(undefined)
        setFilter("all")
        setActionTypeFilter(null)
        setSearchQuery("")
    }

    // Set predefined date ranges
    const setLastDay = () => {
        const today = new Date()
        setDateRange({
            from: subDays(today, 1),
            to: today,
        })
    }

    const setLastWeek = () => {
        const today = new Date()
        setDateRange({
            from: subDays(today, 7),
            to: today,
        })
    }

    const setLastMonth = () => {
        const today = new Date()
        setDateRange({
            from: subDays(today, 30),
            to: today,
        })
    }

    const exportLogsToCSV = () => {
        try {
            // Build API URL with filters
            const { startDate, endDate } = getQueryDateRange()
            const params = new URLSearchParams({
                filter,
            })

            if (startDate) params.append("startDate", startDate.toISOString())
            if (endDate) params.append("endDate", endDate.toISOString())
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

    const [month, setMonth] = useState(new Date())

    const daysInMonth = (date: Date) => {
        const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
        return Array.from({ length: lastDayOfMonth }, (_, i) => i + 1)
    }

    const firstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    }

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    }

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    }

    const days = daysInMonth(currentMonth)
    const paddingDays = firstDayOfMonth(currentMonth)

    const handleDateSelect = (day: number) => {
        const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        setDateRange({ from: selectedDate, to: selectedDate })
        setIsFilterOpen(false)
    }

    const [popupMessage, setPopupMessage] = useState<string | null>(null)

    const showPopup = (message: string) => {
        setPopupMessage(message)
        setTimeout(() => {
            setPopupMessage(null)
        }, 3000)
    }

    // Fetch log stats - separate function to avoid duplicate calls
    const fetchLogStats = async () => {
        try {
            const { startDate, endDate } = getQueryDateRange()
            const params = new URLSearchParams()

            if (startDate) params.append("startDate", startDate.toISOString())
            if (endDate) params.append("endDate", endDate.toISOString())
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
    }

    // Handle tab change
    const handleTabChange = (value: string) => {
        setActiveTab(value)

        // Update filter based on tab
        if (value === "catActivity") {
            setFilter("cat-activity")
        } else if (value === "system") {
            setFilter("all") // We'll filter out cat activity logs in the UI
        } else {
            setFilter("all")
        }
    }

    return (
      <div className="space-y-6">
          <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">System Logs</h1>
              <div className="flex gap-2">
                  <Button variant="outline" onClick={fixLogLevels}>
                      Fix Log Levels
                  </Button>
                  <Button variant="outline" onClick={exportLogsToCSV}>
                      <DownloadCloud className="h-4 w-4 mr-2" />
                      Export CSV
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

          <Card>
              <CardHeader>
                  <CardTitle>Log Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="grid grid-cols-6 gap-4">
                      <div className="bg-gray-100 p-4 rounded-md text-center">
                          <div className="text-2xl font-bold">{logStats.total}</div>
                          <div className="text-sm text-gray-500">Total</div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-md text-center">
                          <div className="text-2xl font-bold text-blue-600">{logStats.info}</div>
                          <div className="text-sm text-gray-500">Info</div>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-md text-center">
                          <div className="text-2xl font-bold text-amber-600">{logStats.warn}</div>
                          <div className="text-sm text-gray-500">Warning</div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-md text-center">
                          <div className="text-2xl font-bold text-red-600">{logStats.error}</div>
                          <div className="text-sm text-gray-500">Error</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-md text-center">
                          <div className="text-2xl font-bold text-orange-600">{logStats.catActivity}</div>
                          <div className="text-sm text-gray-500">Cat Activity</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-md text-center">
                          <div className="text-2xl font-bold text-gray-600">{logStats.other}</div>
                          <div className="text-sm text-gray-500">Other</div>
                      </div>
                  </div>
              </CardContent>
          </Card>

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
                                  <Popover>
                                      <PopoverTrigger asChild>
                                          <Button variant="outline" className="flex items-center">
                                              <Calendar className="h-4 w-4 mr-2" />
                                              {dateRange?.from ? (
                                                <span className="hidden md:inline">{dateRangeText}</span>
                                              ) : (
                                                <span>Date Range</span>
                                              )}
                                          </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                          <div className="p-3 border-b">
                                              <div className="flex justify-between items-center">
                                                  <h4 className="font-medium">Select Date Range</h4>
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
                                          {/* Custom Calendar Component */}
                                          <div className="p-2">
                                              <div className="flex justify-between items-center mb-2">
                                                  <Button variant="ghost" size="icon" onClick={prevMonth}>
                                                      <ChevronLeft className="h-4 w-4" />
                                                  </Button>
                                                  <span className="text-sm font-medium">{format(currentMonth, "MMMM yyyy")}</span>
                                                  <Button variant="ghost" size="icon" onClick={nextMonth}>
                                                      <ChevronRight className="h-4 w-4" />
                                                  </Button>
                                              </div>
                                              <div className="grid grid-cols-7 gap-1">
                                                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                                                    <div key={day} className="text-center text-xs font-medium text-gray-500">
                                                        {day}
                                                    </div>
                                                  ))}
                                                  {Array(paddingDays)
                                                    .fill(null)
                                                    .map((_, index) => (
                                                      <div key={`padding-${index}`} className="text-center text-sm p-1" />
                                                    ))}
                                                  {days.map((day) => {
                                                      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                                                      const isSelected =
                                                        dateRange?.from &&
                                                        dateRange.to &&
                                                        isSameDay(date, dateRange.from) &&
                                                        isSameDay(date, dateRange.to)
                                                      return (
                                                        <Button
                                                          key={day}
                                                          variant={isSelected ? "secondary" : "ghost"}
                                                          className="text-center text-sm p-1 rounded-md w-8 h-8"
                                                          onClick={() => handleDateSelect(day)}
                                                        >
                                                            {day}
                                                        </Button>
                                                      )
                                                  })}
                                              </div>
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

                                  {(dateRange?.from || filter !== "all" || actionTypeFilter || searchQuery) && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
                                        Clear filters
                                    </Button>
                                  )}
                              </div>
                          </div>
                      </div>

                      {/* Show active filters */}
                      {(dateRange?.from || filter !== "all" || actionTypeFilter || searchQuery) && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            <div className="text-sm text-gray-500 mr-2">Active filters:</div>
                            {dateRange?.from && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {dateRange.to
                                    ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`
                                    : format(dateRange.from, "MMM d, yyyy")}
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
                                  <Search className="h-3 w-3" />"{searchQuery}"
                              </Badge>
                            )}
                        </div>
                      )}

                      <TabsContent value="all">
                          <LogsContent
                            logs={logs}
                            loading={loading}
                            hasMore={hasMore}
                            loadingMore={loadingMore}
                            loadMoreLogs={loadMoreLogs}
                            formatUserInfo={formatUserInfo}
                            getLevelIcon={getLevelIcon}
                            formatDateTime={formatDateTime}
                            actionTypeLabels={actionTypeLabels}
                          />
                      </TabsContent>

                      <TabsContent value="system">
                          <LogsContent
                            logs={logs.filter((log) => !log.actionType)}
                            loading={loading}
                            hasMore={hasMore}
                            loadingMore={loadingMore}
                            loadMoreLogs={loadMoreLogs}
                            formatUserInfo={formatUserInfo}
                            getLevelIcon={getLevelIcon}
                            formatDateTime={formatDateTime}
                            actionTypeLabels={actionTypeLabels}
                          />
                      </TabsContent>

                      <TabsContent value="catActivity">
                          <LogsContent
                            logs={logs.filter((log) => log.actionType)}
                            loading={loading}
                            hasMore={hasMore}
                            loadingMore={loadingMore}
                            loadMoreLogs={loadMoreLogs}
                            formatUserInfo={formatUserInfo}
                            getLevelIcon={getLevelIcon}
                            formatDateTime={formatDateTime}
                            actionTypeLabels={actionTypeLabels}
                          />
                      </TabsContent>
                  </Tabs>
              </CardContent>
          </Card>
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
}) {
    if (loading) {
        return (
          <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <span className="ml-2">Loading logs...</span>
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
                                className={`ml-2 text-xs px-2 py-0.5 rounded ${actionTypeLabels[log.actionType]?.color || "bg-gray-100"}`}
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
