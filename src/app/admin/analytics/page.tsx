"use client"

import { useState } from "react"
import { BarChart3, TrendingUp, Users, Eye } from "lucide-react"

export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d")

    // Mock data - in a real app, this would come from Firebase Analytics or a similar service
    const pageViews = {
        "7d": 423,
        "30d": 1243,
        "90d": 3845,
        "1y": 15280,
    }

    const visitors = {
        "7d": 128,
        "30d": 412,
        "90d": 1256,
        "1y": 5120,
    }

    const popularCats = [
        { name: "Whiskers", views: 423, breed: "Persian" },
        { name: "Shadow", views: 317, breed: "Maine Coon" },
        { name: "Luna", views: 289, breed: "Siamese" },
        { name: "Oliver", views: 245, breed: "Tabby" },
        { name: "Bella", views: 198, breed: "Ragdoll" },
    ]

    const trafficSources = [
        { source: "Google", percentage: 45 },
        { source: "Direct", percentage: 30 },
        { source: "Social Media", percentage: 15 },
        { source: "Referrals", percentage: 10 },
    ]

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Analytics</h1>

                <div className="flex bg-white rounded-lg shadow">
                    {(["7d", "30d", "90d", "1y"] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 ${timeRange === range ? "bg-orange-500 text-white" : "hover:bg-gray-100"}`}
                        >
                            {range === "7d" ? "7 days" : range === "30d" ? "30 days" : range === "90d" ? "90 days" : "1 year"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="bg-orange-100 p-3 rounded-full text-orange-500 mr-4">
                            <Eye size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Page Views</p>
                            <p className="text-2xl font-bold">{pageViews[timeRange].toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="bg-blue-100 p-3 rounded-full text-blue-500 mr-4">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Unique Visitors</p>
                            <p className="text-2xl font-bold">{visitors[timeRange].toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="bg-green-100 p-3 rounded-full text-green-500 mr-4">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Avg. Time on Site</p>
                            <p className="text-2xl font-bold">2:34</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="bg-purple-100 p-3 rounded-full text-purple-500 mr-4">
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Bounce Rate</p>
                            <p className="text-2xl font-bold">42%</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">Popular Cats</h2>
                    <div className="space-y-4">
                        {popularCats.map((cat, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 bg-gray-200 rounded-full mr-3"></div>
                                    <div>
                                        <p className="font-medium">{cat.name}</p>
                                        <p className="text-sm text-gray-500">{cat.breed}</p>
                                    </div>
                                </div>
                                <span className="text-sm font-medium">{cat.views} views</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">Traffic Sources</h2>
                    <div className="space-y-4">
                        {trafficSources.map((source, i) => (
                            <div key={i}>
                                <div className="flex items-center justify-between mb-1">
                                    <span>{source.source}</span>
                                    <span className="font-medium">{source.percentage}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${source.percentage}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
