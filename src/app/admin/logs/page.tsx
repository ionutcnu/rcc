"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase/firebaseConfig"
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, RefreshCw, Search, AlertCircle, Info, AlertTriangle, ExternalLink } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { LogEntry } from "@/lib/types"

export default function LogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<"all" | "info" | "warn" | "error">("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [indexUrl, setIndexUrl] = useState<string | null>(null)

    // Fetch logs on component mount and when filter changes
    useEffect(() => {
        fetchLogs()
    }, [filter])

    const fetchLogs = async () => {
        try {
            setLoading(true)
            setError(null)
            setIndexUrl(null)

            // Create base query
            let logsQuery

            if (filter === "all") {
                // For "all" we can just order by timestamp without a where clause
                logsQuery = query(collection(db, "logs"), orderBy("timestamp", "desc"), limit(100))
            } else {
                try {
                    // Try the filtered query - this might fail if the index doesn't exist
                    logsQuery = query(
                        collection(db, "logs"),
                        where("level", "==", filter),
                        orderBy("timestamp", "desc"),
                        limit(100),
                    )
                } catch (err) {
                    // If there's an error creating the query, fall back to the unfiltered query
                    console.error("Error creating filtered query:", err)
                    logsQuery = query(collection(db, "logs"), orderBy("timestamp", "desc"), limit(100))
                }
            }

            const snapshot = await getDocs(logsQuery)

            const fetchedLogs = snapshot.docs.map((doc) => {
                const data = doc.data()
                return {
                    id: doc.id,
                    timestamp: data.timestamp?.toDate() || new Date(),
                    level: data.level || "info", // Default to info if level is missing
                    message: data.message || "No message",
                    details: data.details,
                    userId: data.userId,
                    userEmail: data.userEmail,
                } as LogEntry
            })

            // If we're using a filter but couldn't use the where clause,
            // filter the results in memory
            const finalLogs = filter !== "all" ? fetchedLogs.filter((log) => log.level === filter) : fetchedLogs

            setLogs(finalLogs)
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

            // Even if there's an error, try to get some logs to display
            try {
                const fallbackQuery = query(collection(db, "logs"), limit(100))
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
                    } as LogEntry
                })

                // Filter client-side if needed
                const finalLogs = filter !== "all" ? fetchedLogs.filter((log) => log.level === filter) : fetchedLogs

                setLogs(finalLogs)
            } catch (fallbackError) {
                console.error("Fallback query also failed:", fallbackError)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchLogs()
        setRefreshing(false)
    }

    // Filter logs by search query
    const filteredLogs = searchQuery
        ? logs.filter(
            (log) =>
                log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (log.details && JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase())),
        )
        : logs

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
    const formatDate = (date: Date) => {
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
        other: logs.filter((log) => !["info", "warn", "error"].includes(log.level)).length,
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">System Logs</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fixLogLevels}>
                        Fix Log Levels
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

            <Card>
                <CardHeader>
                    <CardTitle>Log Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-5 gap-4">
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
                        <div className="bg-gray-50 p-4 rounded-md text-center">
                            <div className="text-2xl font-bold text-gray-600">{logStats.other}</div>
                            <div className="text-sm text-gray-500">Other</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Log Entries</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2 mb-6">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search logs..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Levels</SelectItem>
                                <SelectItem value="info">Info</SelectItem>
                                <SelectItem value="warn">Warning</SelectItem>
                                <SelectItem value="error">Error</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                            <span className="ml-2">Loading logs...</span>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No logs found matching your criteria.</div>
                    ) : (
                        <div className="space-y-4">
                            {filteredLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className={`p-4 rounded-md border ${
                                        log.level === "error"
                                            ? "bg-red-50 border-red-200"
                                            : log.level === "warn"
                                                ? "bg-amber-50 border-amber-200"
                                                : "bg-white border-gray-200"
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center">
                                            {getLevelIcon(log.level)}
                                            <span className="ml-2 font-medium">{log.message}</span>
                                            <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{log.level}</span>
                                        </div>
                                        <span className="text-xs text-gray-500">{formatDate(log.timestamp)}</span>
                                    </div>

                                    {log.details && (
                                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto mt-2">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                                    )}

                                    {/* Updated user information display */}
                                    {formatUserInfo(log)}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
