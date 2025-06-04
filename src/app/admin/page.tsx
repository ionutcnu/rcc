"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Cat, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { fetchCats, fetchMediaStats, fetchRecentActivity } from "@/lib/api/dashboardClient"
import { getProxiedImageUrl } from "@/lib/utils/image-utils"
import { Badge } from "@/components/ui/badge"
import { CatProfile } from '@/lib/types/cat';


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

                // Fetch all data in parallel for better performance
                const [cats, mediaStats, activityData] = await Promise.all([
                    fetchCats(),
                    fetchMediaStats(),
                    fetchRecentActivity(4)
                ])
                const totalCats = cats.length

                // Update state with fetched data
                setStats({
                    totalCats,
                    mediaFiles: mediaStats.totalFiles,
                })
                setRecentActivity(activityData)

                // Get popular cats based on views
                const popularCatsData = cats
                  .filter((cat: CatProfile) => cat.views !== undefined)
                  .sort((a: CatProfile, b: CatProfile) => (b.views || 0) - (a.views || 0))
                  .slice(0, 3)
                  .map((cat: CatProfile) => ({
                      id: cat.id,
                      name: cat.name,
                      breed: cat.breed,
                      views: cat.views || 0,
                      imageUrl: cat.mainImage || cat.images?.[0],
                  }));

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
      <div className="space-y-8 py-4">
          <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
              <Button asChild size="default" className="gap-2">
                  <Link href="/admin/cats/add">
                      <Cat className="h-4 w-4" />
                      Add New Cat
                  </Link>
              </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <Card className="hover:shadow-md transition-shadow overflow-hidden border-l-4 border-l-orange-400">
                  <CardContent className="p-8">
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="text-sm font-medium text-gray-500 mb-2">Total Cats</p>
                              <p className="text-4xl font-bold mb-3">{stats.totalCats}</p>
                              <Link
                                href="/admin/cats"
                                className="text-sm font-medium text-orange-500 hover:underline flex items-center gap-1"
                              >
                                  View details
                                  <span className="inline-block">→</span>
                              </Link>
                          </div>
                          <div className="p-4 rounded-full bg-orange-100 text-orange-500">
                              <Cat className="h-6 w-6" />
                          </div>
                      </div>
                  </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow overflow-hidden border-l-4 border-l-blue-400">
                  <CardContent className="p-8">
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="text-sm font-medium text-gray-500 mb-2">Media Files</p>
                              <p className="text-4xl font-bold mb-3">{stats.mediaFiles}</p>
                              <Link
                                href="/admin/media"
                                className="text-sm font-medium text-blue-500 hover:underline flex items-center gap-1"
                              >
                                  View details
                                  <span className="inline-block">→</span>
                              </Link>
                          </div>
                          <div className="p-4 rounded-full bg-blue-100 text-blue-500">
                              <ImageIcon className="h-6 w-6" />
                          </div>
                      </div>
                  </CardContent>
              </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                      <div className="p-6 border-b bg-gray-50">
                          <h2 className="text-xl font-bold">Recent Activity</h2>
                          <p className="text-sm text-gray-500 mt-1">Latest actions in the admin panel</p>
                      </div>
                      {recentActivity.length > 0 ? (
                        <div className="divide-y">
                            {recentActivity.map((activity) => (
                              <div key={activity.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                  <div className="flex items-center gap-3 min-w-0 max-w-[70%]">
                                      <Badge
                                        variant={
                                            activity.status === "success"
                                              ? "default"
                                              : activity.status === "warning"
                                                ? "destructive"
                                                : "secondary"
                                        }
                                        className="whitespace-nowrap flex-shrink-0 px-2 py-1"
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
                        <div className="text-center py-12 text-gray-500">
                            <p>No recent activity</p>
                        </div>
                      )}
                  </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                      <div className="p-6 border-b bg-gray-50">
                          <h2 className="text-xl font-bold">Popular Cats</h2>
                          <p className="text-sm text-gray-500 mt-1">Based on page views</p>
                      </div>
                      {popularCats.length > 0 ? (
                        <div className="divide-y">
                            {popularCats.map((cat) => (
                              <div key={cat.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                  <div className="flex items-center gap-4">
                                      <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden relative border-2 border-orange-100">
                                          {cat.imageUrl ? (
                                            <Image
                                              src={getProxiedImageUrl(cat.imageUrl) || "/placeholder.svg"}
                                              alt={cat.name}
                                              fill
                                              className="object-cover"
                                              sizes="48px"
                                            />
                                          ) : (
                                            <Cat className="h-6 w-6 m-3 text-gray-400" />
                                          )}
                                      </div>
                                      <div>
                                          <p className="font-medium">{cat.name}</p>
                                          <p className="text-sm text-muted-foreground">{cat.breed}</p>
                                      </div>
                                  </div>
                                  <span className="text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">{cat.views} views</span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
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
        let date: Date;

        // Handle different timestamp formats
        if (timestamp.toDate && typeof timestamp.toDate === "function") {
            // Firebase Timestamp object
            date = timestamp.toDate();
        } else if (timestamp.seconds && timestamp.nanoseconds) {
            // Firestore Timestamp-like object from JSON
            date = new Date(timestamp.seconds * 1000);
        } else if (typeof timestamp === 'string') {
            // ISO string
            date = new Date(timestamp);
        } else if (timestamp instanceof Date) {
            // Already a Date object
            date = timestamp;
        } else if (typeof timestamp === 'number') {
            // Unix timestamp in milliseconds
            date = new Date(timestamp);
        } else {
            return "recently";
        }

        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.error("Invalid date:", timestamp);
            return "recently";
        }

        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return "just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 172800) return "1 day ago";
        return `${Math.floor(diffInSeconds / 86400)} days ago`;
    } catch (error) {
        console.error("Error formatting time:", error, timestamp);
        return "recently";
    }

}
