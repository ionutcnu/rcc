"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

type LogStats = {
    total: number
    info: number
    warn: number
    error: number
    debug: number
    unknown: number
}

export function LogStats() {
    const [stats, setStats] = useState<LogStats>({
        total: 0,
        info: 0,
        warn: 0,
        error: 0,
        debug: 0,
        unknown: 0,
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchStats() {
            try {
                setLoading(true)
                setError(null)

                const response = await fetch("/api/logs/stats", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    cache: "no-store",
                })

                if (!response.ok) {
                    throw new Error(`Failed to fetch log stats: ${response.status}`)
                }

                const data = await response.json()

                // Handle different response formats
                if (data && typeof data === "object") {
                    // If the API returns the stats directly
                    if ("total" in data && "info" in data) {
                        setStats({
                            total: Number(data.total) || 0,
                            info: Number(data.info) || 0,
                            warn: Number(data.warn) || 0,
                            error: Number(data.error) || 0,
                            debug: Number(data.debug) || 0,
                            unknown: Number(data.unknown) || 0,
                        })
                    }
                    // If the API returns stats in a nested structure
                    else if (data.stats && typeof data.stats === "object") {
                        setStats({
                            total: Number(data.stats.total) || 0,
                            info: Number(data.stats.info) || 0,
                            warn: Number(data.stats.warn) || 0,
                            error: Number(data.stats.error) || 0,
                            debug: Number(data.stats.debug) || 0,
                            unknown: Number(data.stats.unknown) || 0,
                        })
                    }
                    // If the API returns counts in a different format
                    else if (data.counts && typeof data.counts === "object") {
                        const counts = data.counts
                        const total = Object.values(counts).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0)

                        setStats({
                            total: total,
                            info: Number(counts.info) || 0,
                            warn: Number(counts.warn) || 0,
                            error: Number(counts.error) || 0,
                            debug: Number(counts.debug) || 0,
                            unknown: Number(counts.unknown) || 0,
                        })
                    }
                    // Fallback for unexpected format
                    else {
                        console.error("Unexpected API response format:", data)
                        setError("Received unexpected data format from the server")
                    }
                } else {
                    setError("Invalid response from server")
                }
            } catch (err) {
                console.error("Error fetching log stats:", err)
                setError("Failed to load log statistics. Please try again later.")
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

    if (loading) {
        return (
          <div className="flex items-center justify-center h-24">
              <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
              <span className="ml-2">Loading stats...</span>
          </div>
        )
    }

    if (error) {
        return (
          <Card>
              <CardHeader>
                  <CardTitle>Log Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-center text-red-500 p-4">{error}</div>
              </CardContent>
          </Card>
        )
    }

    return (
      <Card>
          <CardHeader>
              <CardTitle>Log Statistics</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-5 gap-4 text-center">
                  <div className="p-2 bg-gray-100 rounded">
                      <div className="text-lg font-bold">{stats.total}</div>
                      <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <div className="p-2 bg-blue-50 rounded">
                      <div className="text-lg font-bold text-blue-600">{stats.info}</div>
                      <div className="text-xs text-gray-500">Info</div>
                  </div>
                  <div className="p-2 bg-amber-50 rounded">
                      <div className="text-lg font-bold text-amber-600">{stats.warn}</div>
                      <div className="text-xs text-gray-500">Warning</div>
                  </div>
                  <div className="p-2 bg-red-50 rounded">
                      <div className="text-lg font-bold text-red-600">{stats.error}</div>
                      <div className="text-xs text-gray-500">Error</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                      <div className="text-lg font-bold text-gray-600">{(stats.debug || 0) + (stats.unknown || 0)}</div>
                      <div className="text-xs text-gray-500">Other</div>
                  </div>
              </div>
          </CardContent>
      </Card>
    )
}
