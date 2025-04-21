"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { db } from "@/lib/firebase/firebaseConfig"
import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    where,
    Timestamp,
    startAfter,
    type DocumentData,
    type Query,
    type QueryDocumentSnapshot,
} from "firebase/firestore"
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

// Number of logs to load at once
const PAGE_SIZE = 50

export default function LogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<"all" | "info" | "warn" | "error" | "cat-activity">("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [indexUrl, setIndexUrl] = useState<string | null>(null)
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
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

    // Build the query based on filters
    const buildQuery = useCallback(
        (lastDoc: QueryDocumentSnapshot<DocumentData> | null = null): Query<DocumentData> => {
            let baseQuery: Query<DocumentData>
            const { startDate, endDate } = getQueryDateRange()

            try {
                // Start with date range filtering if available
                if (startDate && endDate) {
                    const startTimestamp = Timestamp.fromDate(startDate)
                    const endTimestamp = Timestamp.fromDate(endDate)

                    // Filter logs by level if specified
                    if (filter === "cat-activity") {
                        baseQuery = query(
                            collection(db, "logs"),
                            where("timestamp", ">=", startTimestamp),
                            where("timestamp", "<=", endTimestamp),
                            where("details.actionType", "!=", null),
                            orderBy("timestamp", "desc"),
                        )
                    } else if (filter !== "all") {
                        baseQuery = query(
                            collection(db, "logs"),
                            where("timestamp", ">=", startTimestamp),
                            where("timestamp", "<=", endTimestamp),
                            where("level", "==", filter),
                            orderBy("timestamp", "desc"),
                        )
                    } else {
                        baseQuery = query(
                            collection(db, "logs"),
                            where("timestamp", ">=", startTimestamp),
                            where("timestamp", "<=", endTimestamp),
                            orderBy("timestamp", "desc"),
                        )
                    }
                }
                // Without date range, just filter by level
                else if (filter === "cat-activity") {
                    baseQuery = query(
                        collection(db, "logs"),
                        where("details.actionType", "!=", null),
                        orderBy("details.actionType"),
                        orderBy("timestamp", "desc"),
                    )
                } else if (filter !== "all") {
                    baseQuery = query(collection(db, "logs"), where("level", "==", filter), orderBy("timestamp", "desc"))
                } else {
                    baseQuery = query(collection(db, "logs"), orderBy("timestamp", "desc"))
                }
            } catch (err) {
                console.error("Error creating filtered query:", err)
                baseQuery = query(collection(db, "logs"), orderBy("timestamp", "desc"))
            }

            // Add pagination
            if (lastDoc) {
                return query(baseQuery, startAfter(lastDoc), limit(PAGE_SIZE))
            }
            return query(baseQuery, limit(PAGE_SIZE))
        },
        [filter, getQueryDateRange],
    )

    // Fetch logs on component mount and when filter changes
    useEffect(() => {
        fetchLogs()
    }, [filter, dateRange, buildQuery])

    const fetchLogs = async () => {
        try {
            setLoading(true)
            setError(null)
            setIndexUrl(null)
            setLastVisible(null)
            setHasMore(true)

            // Create query based on current filters
            const logsQuery = buildQuery()

            try {
                const snapshot = await getDocs(logsQuery)

                // Set the last visible document for pagination
                if (snapshot.docs.length > 0) {
                    setLastVisible(snapshot.docs[snapshot.docs.length - 1])
                    setHasMore(snapshot.docs.length >= PAGE_SIZE)
                } else {
                    setHasMore(false)
                }

                const fetchedLogs = snapshot.docs.map((doc) => {
                    const data = doc.data()
                    return {
                        id: doc.id,
                        timestamp: data.timestamp?.toDate() || new Date(),
                        level: data.level || "info",
                        message: data.message || "No message",
                        details: data.details,
                        userId: data.userId,
                        userEmail: data.userEmail,
                        catId: data.catId || data.details?.catId,
                        catName: data.catName || data.details?.catName,
                        actionType: data.actionType || data.details?.actionType,
                    } as LogEntry
                })

                setLogs(fetchedLogs)
            } catch (error: any) {
                console.error("Error fetching logs:", error)
                setError(error.message || "Failed to fetch logs")

                // Extract the index URL if this is a missing index error
                if (error.message && error.message.includes("https://console.firebase.google.com")) {
                    const urlMatch = error.message.match(/(https:\/\/console\.firebase\.google\.com\S+)/)
                    if (urlMatch && urlMatch[1]) {
                        setIndexUrl(urlMatch[1])
                    }
                }

                // Try a fallback query
                try {
                    const fallbackQuery = query(collection(db, "logs"), limit(PAGE_SIZE))
                    const snapshot = await getDocs(fallbackQuery)

                    const fetchedLogs = snapshot.docs.map((doc) => {
                        const data = doc.data()
                        return {
                            id: doc.id,
                            timestamp: data.timestamp?.toDate() || new Date(),
                            level: data.level || "info",
                            message: data.message || "No message",
                            details: data.details,
                            userId: data.userId,
                            userEmail: data.userEmail,
                            catId: data.catId || data.details?.catId,
                            catName: data.catName || data.details?.catName,
                            actionType: data.actionType || data.details?.actionType,
                        } as LogEntry
                    })

                    setLogs(fetchedLogs)

                    if (snapshot.docs.length > 0) {
                        setLastVisible(snapshot.docs[snapshot.docs.length - 1])
                        setHasMore(snapshot.docs.length >= PAGE_SIZE)
                    } else {
                        setHasMore(false)
                    }
                } catch (fallbackError) {
                    console.error("Fallback query also failed:", fallbackError)
                }
            }
        } finally {
            setLoading(false)
        }
    }

    // Load more logs for pagination
    const loadMoreLogs = async () => {
        if (!lastVisible || loadingMore) return

        try {
            setLoadingMore(true)

            // Create query from the last document
            const logsQuery = buildQuery(lastVisible)
            const snapshot = await getDocs(logsQuery)

            // Update last visible doc for next pagination
            if (snapshot.docs.length > 0) {
                setLastVisible(snapshot.docs[snapshot.docs.length - 1])
                setHasMore(snapshot.docs.length >= PAGE_SIZE)
            } else {
                setHasMore(false)
            }

            const moreLogs = snapshot.docs.map((doc) => {
                const data = doc.data()
                return {
                    id: doc.id,
                    timestamp: data.timestamp?.toDate() || new Date(),
                    level: data.level || "info",
                    message: data.message || "No message",
                    details: data.details,
                    userId: data.userId,
                    userEmail: data.userEmail,
                    catId: data.catId || data.details?.catId,
                    catName: data.catName || data.details?.catName,
                    actionType: data.actionType || data.details?.actionType,
                } as LogEntry
            })

            // Append new logs to existing logs
            setLogs((prevLogs) => [...prevLogs, ...moreLogs])
        } catch (error) {
            console.error("Error loading more logs:", error)
        } finally {
            setLoadingMore(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchLogs()
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

    // Export logs to CSV
    const exportLogsToCSV = () => {
        if (filteredLogs.length === 0) {
            showPopup("No logs to export")
            return
        }

        const csvData = convertToCSV(filteredLogs)
        downloadCSV(csvData, "system-logs.csv")
    }

    const convertToCSV = (logs: LogEntry[]) => {
        const header = [
            "Timestamp",
            "Level",
            "Message",
            "User ID",
            "User Email",
            "Cat ID",
            "Cat Name",
            "Action Type",
            "Details",
        ]
        const rows = logs.map((log) => [
            formatDateTime(log.timestamp),
            log.level,
            log.message,
            log.userId || "",
            log.userEmail || "",
            log.catId || "",
            log.catName || "",
            log.actionType || "",
            JSON.stringify(log.details) || "",
        ])

        return [header, ...rows].map((row) => row.join(",")).join("\n")
    }

    const downloadCSV = (csvData: string, filename: string) => {
        const blob = new Blob([csvData], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // Filter logs by search query and action type
    const filteredLogs = logs.filter((log) => {
        // Search query filter
        const matchesSearch = searchQuery
            ? log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (log.details && JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase())) ||
            (log.catName && log.catName.toLowerCase().includes(searchQuery.toLowerCase()))
            : true

        // Action type filter for cat activities
        const matchesActionType = actionTypeFilter ? log.actionType === actionTypeFilter : true

        return matchesSearch && matchesActionType
    })

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

    // Fix log levels
    const fixLogLevels = async () => {
        try {
            const response = await fetch("/api/logs/fix-levels")
            const data = await response.json()
            if (data.success) {
                handleRefresh()
            }
        } catch (error) {
            console.error("Error fixing log levels:", error)
        }
    }

    // Log statistics
    const logStats = {
        total: logs.length,
        info: logs.filter((log) => log.level === "info").length,
        warn: logs.filter((log) => log.level === "warn").length,
        error: logs.filter((log) => log.level === "error").length,
        catActivity: logs.filter((log) => log.actionType).length,
        other: logs.filter((log) => !["info", "warn", "error"].includes(log.level) && !log.actionType).length,
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
                    <Tabs defaultValue="all" className="mt-4" onValueChange={setActiveTab} value={activeTab}>
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

                                    <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue placeholder="Log Level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Levels</SelectItem>
                                            <SelectItem value="info">Info</SelectItem>
                                            <SelectItem value="warn">Warning</SelectItem>
                                            <SelectItem value="error">Error</SelectItem>
                                            <SelectItem value="cat-activity">Cat Activity</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {activeTab === "catActivity" && (
                                        <Select
                                            value={actionTypeFilter || ""}
                                            onValueChange={(value) => setActionTypeFilter(value || null)}
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
                                logs={filteredLogs}
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
                                logs={filteredLogs.filter((log) => !log.actionType)}
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
                                logs={filteredLogs.filter((log) => log.actionType)}
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
