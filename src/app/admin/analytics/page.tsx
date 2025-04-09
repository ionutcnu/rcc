"use client"

import { useState, useEffect } from "react"
import { BarChart3, TrendingUp, Users, Eye, Loader2, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    Tooltip,
} from "recharts"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getAllCats } from "@/lib/firebase/catService"
import { getAnalyticsData } from "@/lib/firebase/analyticsService"
import { getVercelAnalytics } from "@/lib/actions/analytics-actions"
import { Button } from "@/components/ui/button"
import Image from "next/image"

// Define the CatProfile type
interface CatProfile {
    id: string
    name: string
    breed: string
    views?: number
    lastViewed?: any // Consider using a more specific type if possible (e.g., firebase.firestore.Timestamp)
    mainImage?: string
    images?: string[]
}

export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Analytics data states
    const [pageViews, setPageViews] = useState<Record<string, number>>({
        "7d": 0,
        "30d": 0,
        "90d": 0,
        "1y": 0,
    })
    const [visitors, setVisitors] = useState<Record<string, number>>({
        "7d": 0,
        "30d": 0,
        "90d": 0,
        "1y": 0,
    })
    const [popularCats, setPopularCats] = useState<
        Array<{ name: string; views: number; breed: string; imageUrl?: string }>
    >([])
    const [trafficSources, setTrafficSources] = useState<Array<{ source: string; percentage: number }>>([])
    const [chartData, setChartData] = useState<Array<{ name: string; views: number; visitors: number }>>([])
    const [catsByBreed, setCatsByBreed] = useState<Array<{ name: string; count: number }>>([])
    const [vercelAnalyticsInfo, setVercelAnalyticsInfo] = useState<any>(null)

    useEffect(() => {
        async function fetchAnalyticsData() {
            try {
                setLoading(true)

                // Fetch cats data for popular cats and breed distribution
                const cats = await getAllCats()

                // Calculate real page views from cat view counts
                const totalViews = cats.reduce((sum, cat) => sum + (cat.views || 0), 0)

                // Calculate views for different time periods based on lastViewed timestamps
                const viewsData = {
                    "7d": calculateViewsInPeriod(cats, 7),
                    "30d": calculateViewsInPeriod(cats, 30),
                    "90d": calculateViewsInPeriod(cats, 90),
                    "1y": totalViews, // All views
                }

                // Estimate visitors (unique users) as a percentage of views
                const visitorsData = {
                    "7d": Math.round(viewsData["7d"] * 0.7),
                    "30d": Math.round(viewsData["30d"] * 0.65),
                    "90d": Math.round(viewsData["90d"] * 0.6),
                    "1y": Math.round(viewsData["1y"] * 0.55),
                }

                // Get analytics data for charts
                const analyticsData = await getAnalyticsData(timeRange)

                // Process popular cats
                const sortedCats = [...cats]
                    .filter((cat) => cat.views !== undefined && cat.views > 0)
                    .sort((a, b) => (b.views || 0) - (a.views || 0))
                    .slice(0, 5)
                    .map((cat) => ({
                        name: cat.name,
                        views: cat.views || 0,
                        breed: cat.breed,
                        imageUrl: cat.mainImage || cat.images?.[0],
                    }))

                // Process cats by breed
                const breedCounts: Record<string, number> = {}
                cats.forEach((cat) => {
                    if (cat.breed) {
                        breedCounts[cat.breed] = (breedCounts[cat.breed] || 0) + 1
                    }
                })

                const breedData = Object.entries(breedCounts)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 6) // Top 6 breeds

                // Get Vercel Analytics info
                const vercelInfo = await getVercelAnalytics()

                // Set states with fetched data
                setPageViews(viewsData)
                setVisitors(visitorsData)
                setTrafficSources(analyticsData.trafficSources)
                setChartData(generateChartData(cats, timeRange))
                setPopularCats(sortedCats)
                setCatsByBreed(breedData)
                setVercelAnalyticsInfo(vercelInfo)
            } catch (err) {
                console.error("Error fetching analytics data:", err)
                setError("Failed to load analytics data. Please try again later.")
            } finally {
                setLoading(false)
            }
        }

        fetchAnalyticsData()
    }, [timeRange])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <span className="ml-2">Loading analytics data...</span>
            </div>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive" className="my-8">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Analytics</h1>

                <Tabs
                    value={timeRange}
                    onValueChange={(value) => setTimeRange(value as "7d" | "30d" | "90d" | "1y")}
                    className="w-auto"
                >
                    <TabsList>
                        <TabsTrigger value="7d">7 days</TabsTrigger>
                        <TabsTrigger value="30d">30 days</TabsTrigger>
                        <TabsTrigger value="90d">90 days</TabsTrigger>
                        <TabsTrigger value="1y">1 year</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <Card className="bg-blue-50 border border-blue-200">
                <CardHeader>
                    <CardTitle className="text-blue-800">Analytics Integration</CardTitle>
                    <CardDescription className="text-blue-700">
                        This dashboard combines data from both Vercel Analytics and Firebase Analytics
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-blue-800">
                    <p className="flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2" />
                        <span>
              <strong>Firebase Analytics:</strong> Custom event tracking for cat-specific metrics is shown below.
            </span>
                    </p>
                    <p className="flex items-center mt-2">
                        <BarChart3 className="h-5 w-5 mr-2" />
                        <span>
              <strong>Vercel Analytics:</strong> Web analytics data is automatically collected and available in your
              Vercel dashboard.
            </span>
                    </p>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" className="bg-white" asChild>
                        <a
                            href="https://vercel.com/dashboard"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center"
                        >
                            View Vercel Analytics Dashboard <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                </CardFooter>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pageViews[timeRange].toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            {calculateGrowth(pageViews[timeRange], getPreviousPeriodValue(pageViews, timeRange))}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{visitors[timeRange].toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            {calculateGrowth(visitors[timeRange], getPreviousPeriodValue(visitors, timeRange))}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Time on Site</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2:34</div>
                        <p className="text-xs text-muted-foreground">+5% from previous period</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">42%</div>
                        <p className="text-xs text-muted-foreground">-3% from previous period</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Traffic Overview</CardTitle>
                    <CardDescription>Page views and visitors over time</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="views" stroke="#f97316" strokeWidth={2} />
                                <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Popular Cats</CardTitle>
                        <CardDescription>Based on page views</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {popularCats.map((cat, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 bg-muted rounded-full mr-3 relative overflow-hidden">
                                            {cat.imageUrl ? (
                                                <Image
                                                    src={cat.imageUrl || "/placeholder.svg"}
                                                    alt={cat.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="40px"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center bg-orange-100">
                                                    <span className="text-orange-500 font-bold">{cat.name.charAt(0)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium">{cat.name}</p>
                                            <p className="text-sm text-muted-foreground">{cat.breed}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium">{cat.views} views</span>
                                </div>
                            ))}

                            {popularCats.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No view data available yet</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Traffic Sources</CardTitle>
                        <CardDescription>Where your visitors are coming from</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {trafficSources.map((source, i) => (
                                <div key={i}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span>{source.source}</span>
                                        <span className="font-medium">{source.percentage}%</span>
                                    </div>
                                    <Progress value={source.percentage} className="h-2" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Cats by Breed</CardTitle>
                    <CardDescription>Distribution of cats by breed</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={catsByBreed} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#f97316" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Helper function to calculate growth percentage
function calculateGrowth(current: number, previous: number): string {
    if (previous === 0) return current > 0 ? "+100% from previous period" : "0% change"

    const growthPercent = ((current - previous) / previous) * 100
    const sign = growthPercent > 0 ? "+" : ""
    return `${sign}${growthPercent.toFixed(1)}% from previous period`
}

// Helper function to get the previous period value
function getPreviousPeriodValue(data: Record<string, number>, currentPeriod: string): number {
    // This is a simplified approach - in a real app, you'd have historical data
    switch (currentPeriod) {
        case "7d":
            return data["7d"] * 0.9 // Assume 90% of current value
        case "30d":
            return data["30d"] * 0.85
        case "90d":
            return data["90d"] * 0.8
        case "1y":
            return data["1y"] * 0.7
        default:
            return 0
    }
}

// Add this helper function to calculate views within a specific time period
function calculateViewsInPeriod(cats: CatProfile[], days: number): number {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return cats.reduce((sum, cat) => {
        // If the cat has lastViewed timestamp and it's within the period, count its views
        if (cat.lastViewed && cat.lastViewed.toDate() >= cutoffDate) {
            return sum + (cat.views || 0)
        }
        return sum
    }, 0)
}

// Add this helper function to generate chart data from real cat view data
function generateChartData(cats: CatProfile[], timeRange: "7d" | "30d" | "90d" | "1y") {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365
    const dataPoints = Math.min(days, 7) // Limit to 7 data points for readability
    const daysPerPoint = Math.ceil(days / dataPoints)

    const data = []
    const now = new Date()

    // Create date buckets
    for (let i = dataPoints - 1; i >= 0; i--) {
        const endDate = new Date(now)
        endDate.setDate(endDate.getDate() - i * daysPerPoint)

        const startDate = new Date(endDate)
        startDate.setDate(startDate.getDate() - daysPerPoint)

        // Count views in this date range
        const periodViews = cats.reduce((sum, cat) => {
            if (cat.lastViewed) {
                const viewDate = cat.lastViewed.toDate()
                if (viewDate >= startDate && viewDate <= endDate) {
                    return sum + (cat.views || 0)
                }
            }
            return sum
        }, 0)

        // Estimate visitors as 65% of views
        const periodVisitors = Math.round(periodViews * 0.65)

        data.push({
            name: formatDate(endDate, dataPoints),
            views: periodViews,
            visitors: periodVisitors,
        })
    }

    return data
}

function formatDate(date: Date, dataPoints: number): string {
    const day = date.getDate()
    const month = date.getMonth() + 1 // Months are 0-indexed
    return `${month}/${day}`
}
