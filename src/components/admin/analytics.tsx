"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, ThumbsUp, MessageSquare, TrendingUp } from "lucide-react"

export function Analytics() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics</h2>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Views" value="12,543" description="+15% from last month" icon={Eye} />
            <StatCard title="Likes" value="8,219" description="+23% from last month" icon={ThumbsUp} />
            <StatCard title="Comments" value="1,432" description="+7% from last month" icon={MessageSquare} />
            <StatCard title="Conversion Rate" value="3.2%" description="+0.8% from last month" icon={TrendingUp} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Traffic</CardTitle>
              <CardDescription>Views over the past 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-end space-x-2">
                {Array.from({ length: 30 }).map((_, i) => {
                  const height = Math.random() * 100
                  return <div key={i} className="bg-primary/90 rounded-t w-full" style={{ height: `${height}%` }} />
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
              <CardDescription>Where your visitors are coming from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Google</span>
                  <span className="font-medium">45%</span>
                </div>
                <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
                  <div className="bg-primary h-full rounded-full" style={{ width: "45%" }} />
                </div>

                <div className="flex items-center justify-between">
                  <span>Direct</span>
                  <span className="font-medium">30%</span>
                </div>
                <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
                  <div className="bg-primary h-full rounded-full" style={{ width: "30%" }} />
                </div>

                <div className="flex items-center justify-between">
                  <span>Social Media</span>
                  <span className="font-medium">15%</span>
                </div>
                <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
                  <div className="bg-primary h-full rounded-full" style={{ width: "15%" }} />
                </div>

                <div className="flex items-center justify-between">
                  <span>Referrals</span>
                  <span className="font-medium">10%</span>
                </div>
                <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
                  <div className="bg-primary h-full rounded-full" style={{ width: "10%" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>Most Popular Cats</CardTitle>
              <CardDescription>Based on views and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <span>Whiskers</span>
                  </div>
                  <span className="font-medium">4,321 views</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <span>Shadow</span>
                  </div>
                  <span className="font-medium">3,752 views</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <span>Luna</span>
                  </div>
                  <span className="font-medium">2,984 views</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: string
  description: string
  icon: React.ElementType
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
