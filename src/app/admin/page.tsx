"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Cat, ImageIcon, BarChart3, TrendingUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAllCats } from "@/lib/firebase/catService"
import { getMediaStats } from "@/lib/firebase/storageService"
import { db } from "@/lib/firebase/firebaseConfig"
import { collection, query, orderBy, limit, getDocs, type Timestamp } from "firebase/firestore"
import type { CatProfile, PopularCat } from "@/lib/types/cat"

type ActivityItem = {
    id: string
    action: string
    catName: string
    timestamp: Timestamp
    status: "success" | "info" | "warning"
}

export default function AdminDashboardPage() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalCats: 0,
        mediaFiles: 0,
        pageViews: 0,
        growth: 0,
    })
    const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
    const [popularCats, setPopularCats] = useState<PopularCat[]>([])

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                setLoading(true)

                // Fetch cats data
                const cats = await getAllCats()
                const totalCats = cats.length

                // Calculate actual page views from cat view counts
                const totalPageViews = cats.reduce((sum, cat) => sum + (cat.views || 0), 0)

                // Fetch media stats
                const mediaStats = await getMediaStats()

                // Fetch recent activity
                const activityRef = collection(db, "activity")
                const activityQuery = query(activityRef, orderBy("timestamp", "desc"), limit(4))
                const activitySnapshot = await getDocs(activityQuery)
                const activityData = activitySnapshot.docs.map((doc) => {
                    const data = doc.data()
                    return {
                        id: doc.id,
                        action: data.action,
                        catName: data.catName,
                        timestamp: data.timestamp,
                        status: data.status || "info",
                    } as ActivityItem
                })

                // Fetch popular cats
                const popularCatsData: PopularCat[] = cats
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

                // Calculate real growth based on cat creation dates and view data
                const growth = calculateRealGrowth(cats)

                // Update state with fetched data
                setStats({
                    totalCats,
                    mediaFiles: mediaStats.totalFiles,
                    pageViews: totalPageViews || 0,
                    growth,
                })
                setRecentActivity(activityData)
                setPopularCats(popularCatsData)
            } catch (error) {
                console.error("Error fetching dashboard data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

    // Calculate growth based on actual view data and creation dates
    function calculateRealGrowth(cats: CatProfile[]): number {
        const now = new Date()
        const currentMonth = now.getMonth()
        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const currentYear = now.getFullYear()
        const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear

        // Get cats created this month and last month
        const catsThisMonth = cats.filter((cat) => {
            if (!cat.createdAt) return false
            // Check if createdAt has toDate method (is a Timestamp)
            if ("toDate" in cat.createdAt) {
                const createdDate = cat.createdAt.toDate()
                return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
            }
            return false
        })

        const catsLastMonth = cats.filter((cat) => {
            if (!cat.createdAt) return false
            // Check if createdAt has toDate method (is a Timestamp)
            if ("toDate" in cat.createdAt) {
                const createdDate = cat.createdAt.toDate()
                return createdDate.getMonth() === previousMonth && createdDate.getFullYear() === previousYear
            }
            return false
        })

        // Calculate total views this month and last month
        const viewsThisMonth = catsThisMonth.reduce((sum, cat) => sum + (cat.views || 0), 0)
        const viewsLastMonth = catsLastMonth.reduce((sum, cat) => sum + (cat.views || 0), 0)

        // Calculate percentage growth
        if (viewsLastMonth === 0) return viewsThisMonth > 0 ? 100 : 0
        return Math.round(((viewsThisMonth - viewsLastMonth) / viewsLastMonth) * 100)
    }

    // Format timestamp to relative time
    function formatRelativeTime(timestamp: Timestamp): string {
        if (!timestamp) return ""

        const now = new Date()
        const date = timestamp.toDate()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffInSeconds < 60) return "just now"
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
        if (diffInSeconds < 172800) return "1 day ago"
        return `${Math.floor(diffInSeconds / 86400)} days ago`
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <span className="ml-2">Loading dashboard data...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <Button asChild>
                    <Link href="/admin/cats/add">Add New Cat</Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-500">Page Views</p>
                                <p className="text-3xl font-bold mt-1">{stats.pageViews.toLocaleString()}</p>
                                <Link href="/admin/analytics" className="text-sm text-gray-500 hover:underline">
                                    View details
                                </Link>
                            </div>
                            <div className="p-3 rounded-full bg-green-100 text-green-500">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-500">Growth</p>
                                <p className="text-3xl font-bold mt-1">{stats.growth > 0 ? `+${stats.growth}%` : `${stats.growth}%`}</p>
                                <Link href="/admin/analytics" className="text-sm text-gray-500 hover:underline">
                                    View details
                                </Link>
                            </div>
                            <div className="p-3 rounded-full bg-purple-100 text-purple-500">
                                <TrendingUp className="h-5 w-5" />
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
                                        <div className="flex items-center gap-3">
                                            <Badge
                                                variant={
                                                    activity.status === "success"
                                                        ? "default"
                                                        : activity.status === "warning"
                                                            ? "destructive"
                                                            : "secondary"
                                                }
                                                className="whitespace-nowrap"
                                            >
                                                {activity.action}
                                            </Badge>
                                            <span className="font-medium text-orange-500">{activity.catName}</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">{formatRelativeTime(activity.timestamp)}</span>
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
                                                        src={cat.imageUrl || "/placeholder.svg"}
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
