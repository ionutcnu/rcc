"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Cat, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getAllCats } from "@/lib/firebase/catService"
import { getMediaStats } from "@/lib/firebase/storageService"
import { getRecentActivity } from "@/lib/firebase/activityService"
// Import the utility function at the top of the file
import { getProxiedImageUrl } from "@/lib/utils/image-utils"
import { Badge } from "@/components/ui/badge"

export default function AdminDashboardPage() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalCats: 0,
        mediaFiles: 0,
    })
    const [recentActivity, setRecentActivity] = useState<any[]>([])
    const [popularCats, setPopularCats] = useState<any[]>([])

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                setLoading(true)

                // Fetch cats data
                const cats = await getAllCats()
                const totalCats = cats.length

                // Fetch media stats
                const mediaStats = await getMediaStats()

                // Fetch recent activity
                const activityData = await getRecentActivity(4)

                // Update state with fetched data
                setStats({
                    totalCats,
                    mediaFiles: mediaStats.totalFiles,
                })
                setRecentActivity(activityData)

                // Get popular cats based on views
                const popularCatsData = cats
                    .filter((cat) => cat.views !== undefined)
                    .sort((a, b) => (b.views || 0) - (a.views || 0))
                    .slice(0, 4)
                    .map((cat) => ({
                        id: cat.id,
                        name: cat.name,
                        breed: cat.breed,
                        views: cat.views || 0,
                        imageUrl: cat.mainImage || cat.images?.[0],
                    }))

                setPopularCats(popularCatsData)
            } catch (error) {
                console.error("Error fetching dashboard data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <Button asChild>
                    <Link href="/admin/cats/add">Add New Cat</Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-500">Total Cats</p>
                                <p className="text-3xl font-bold mt-1">{stats.totalCats}</p>
                                <Link href="/admin/cats" className="text-sm text-gray-500 hover:underline">
                                    View details
                                </Link>
                            </div>
                            <div className="p-3 rounded-full bg-orange-100 text-orange-500">
                                <Cat className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-500">Media Files</p>
                                <p className="text-3xl font-bold mt-1">{stats.mediaFiles}</p>
                                <Link href="/admin/media" className="text-sm text-gray-500 hover:underline">
                                    View details
                                </Link>
                            </div>
                            <div className="p-3 rounded-full bg-blue-100 text-blue-500">
                                <ImageIcon className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold mb-2">Recent Activity</h2>
                        <p className="text-sm text-gray-500 mb-4">Latest actions in the admin panel</p>
                        {recentActivity.length > 0 ? (
                            <div className="space-y-4">
                                {recentActivity.map((activity) => (
                                    <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                        <div className="flex items-center gap-3 min-w-0 max-w-[70%]">
                                            <Badge
                                                variant={
                                                    activity.status === "success"
                                                        ? "default"
                                                        : activity.status === "warning"
                                                            ? "destructive"
                                                            : "secondary"
                                                }
                                                className="whitespace-nowrap flex-shrink-0"
                                            >
                                                {activity.action}
                                            </Badge>
                                            <span className="font-medium text-orange-500 truncate" title={activity.catName}>
                        {activity.catName}
                      </span>
                                        </div>
                                        <span className="text-sm text-muted-foreground flex-shrink-0">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>No recent activity</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold mb-2">Popular Cats</h2>
                        <p className="text-sm text-gray-500 mb-4">Based on page views</p>
                        {popularCats.length > 0 ? (
                            <div className="space-y-4">
                                {popularCats.map((cat) => (
                                    <div key={cat.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden relative">
                                                {cat.imageUrl ? (
                                                    <Image
                                                        src={getProxiedImageUrl(cat.imageUrl) || "/placeholder.svg"}
                                                        alt={cat.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="40px"
                                                    />
                                                ) : (
                                                    <Cat className="h-6 w-6 m-2 text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">{cat.name}</p>
                                                <p className="text-sm text-muted-foreground">{cat.breed}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm">{cat.views} views</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>No data available</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// Helper function to format date
function formatRelativeTime(timestamp: any): string {
    if (!timestamp) return ""

    try {
        const now = new Date()
        const date = timestamp.toDate()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffInSeconds < 60) return "just now"
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
        if (diffInSeconds < 172800) return "1 day ago"
        return `${Math.floor(diffInSeconds / 86400)} days ago`
    } catch (error) {
        return "recently"
    }
}
