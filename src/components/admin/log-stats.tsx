"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase/firebaseConfig"
import { collection, getDocs } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function LogStats() {
    const [stats, setStats] = useState<{
        total: number
        info: number
        warn: number
        error: number
        debug: number
        unknown: number
    }>({
        total: 0,
        info: 0,
        warn: 0,
        error: 0,
        debug: 0,
        unknown: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            try {
                setLoading(true)
                const logsRef = collection(db, "logs")
                const snapshot = await getDocs(logsRef)

                const newStats = {
                    total: snapshot.size,
                    info: 0,
                    warn: 0,
                    error: 0,
                    debug: 0,
                    unknown: 0,
                }

                snapshot.docs.forEach((doc) => {
                    const data = doc.data()
                    if (data.level === "info") newStats.info++
                    else if (data.level === "warn") newStats.warn++
                    else if (data.level === "error") newStats.error++
                    else if (data.level === "debug") newStats.debug++
                    else newStats.unknown++
                })

                setStats(newStats)
            } catch (error) {
                console.error("Error fetching log stats:", error)
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
                        <div className="text-lg font-bold text-gray-600">{stats.debug + stats.unknown}</div>
                        <div className="text-xs text-gray-500">Other</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
