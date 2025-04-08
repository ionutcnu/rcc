import Link from "next/link"
import { Cat, ImageIcon, BarChart3, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AdminDashboardPage() {
    // In a real app, you would fetch this data from Firebase
    const stats = [
        {
            title: "Total Cats",
            value: "24",
            icon: Cat,
            href: "/admin/cats",
            color: "bg-orange-100 text-orange-500",
            viewDetails: true,
        },
        {
            title: "Media Files",
            value: "86",
            icon: ImageIcon,
            href: "/admin/media",
            color: "bg-blue-100 text-blue-500",
            viewDetails: true,
        },
        {
            title: "Page Views",
            value: "1,243",
            icon: BarChart3,
            href: "/admin/analytics",
            color: "bg-green-100 text-green-500",
            viewDetails: true,
        },
        {
            title: "Growth",
            value: "+12%",
            icon: TrendingUp,
            href: "/admin/analytics",
            color: "bg-purple-100 text-purple-500",
            viewDetails: true,
        },
    ]

    const recentActivity = [
        { action: "Added new cat", name: "Mittens", time: "2 hours ago", status: "success" },
        { action: "Updated cat", name: "Whiskers", time: "5 hours ago", status: "info" },
        { action: "Uploaded new photos", name: "Luna", time: "1 day ago", status: "info" },
        { action: "Archived cat", name: "Oscar", time: "3 days ago", status: "warning" },
    ]

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <Button asChild>
                    <Link href="/admin/cats/add">Add New Cat</Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.title} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500">{stat.title}</p>
                                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                                    {stat.viewDetails && (
                                        <Link href={stat.href} className="text-sm text-gray-500 hover:underline">
                                            View details
                                        </Link>
                                    )}
                                </div>
                                <div className={`p-3 rounded-full ${stat.color}`}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold mb-2">Recent Activity</h2>
                        <p className="text-sm text-gray-500 mb-4">Latest actions in the admin panel</p>
                        <div className="space-y-4">
                            {recentActivity.map((activity, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
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
                                        <span className="font-medium text-orange-500">{activity.name}</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">{activity.time}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-bold mb-2">Popular Cats</h2>
                        <p className="text-sm text-gray-500 mb-4">Based on page views</p>
                        <div className="space-y-4">
                            {[
                                { name: "Whiskers", views: "423 views", breed: "Persian" },
                                { name: "Shadow", views: "317 views", breed: "Maine Coon" },
                                { name: "Luna", views: "289 views", breed: "Siamese" },
                                { name: "Oliver", views: "245 views", breed: "Tabby" },
                            ].map((cat, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                                        <div>
                                            <p className="font-medium">{cat.name}</p>
                                            <p className="text-sm text-muted-foreground">{cat.breed}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm">{cat.views}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
