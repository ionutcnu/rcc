"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AreaChart,
  BarChart,
  LineChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  type TooltipProps,
} from "recharts"

interface UsageHistoryChartProps {
  usageHistory: { date: string; count: number }[]
  characterLimit: number
  warningThreshold: number
  criticalThreshold: number
}

// Define chart data type
interface ChartDataItem {
  day: string
  date: string
  count: number
  percentUsed: number
  status: "normal" | "warning" | "critical"
}

export function UsageHistoryChart({
                                    usageHistory,
                                    characterLimit,
                                    warningThreshold,
                                    criticalThreshold,
                                  }: UsageHistoryChartProps) {
  const [chartType, setChartType] = useState<"bar" | "line" | "area">("bar")
  const [chartData, setChartData] = useState<ChartDataItem[]>([])

  // Process chart data when props change
  useEffect(() => {
    // Only process actual data, no more sample data
    if (usageHistory && usageHistory.length > 0) {
      processChartData(usageHistory)
    } else {
      // If no data, set empty chart data
      setChartData([])
    }
  }, [usageHistory, characterLimit, warningThreshold, criticalThreshold])

  // Process the chart data
  const processChartData = (data: { date: string; count: number }[]) => {
    // Format the data for the chart
    const formattedData: ChartDataItem[] = data.map((day) => {
      const percentUsed = (day.count / characterLimit) * 100
      const status =
        percentUsed >= criticalThreshold ? "critical" : percentUsed >= warningThreshold ? "warning" : "normal"

      // Extract day number from date string (assuming format YYYY-MM-DD)
      const dayNumber = day.date.split("-")[2]

      return {
        day: dayNumber,
        date: day.date,
        count: day.count,
        percentUsed,
        status,
      }
    })

    // Sort by date
    formattedData.sort((a, b) => a.date.localeCompare(b.date))

    // Update state
    setChartData(formattedData)
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium">Day {label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}:{" "}
              {entry.dataKey === "percentUsed"
                ? `${Number(entry.value).toFixed(1)}%`
                : entry.dataKey === "count"
                  ? Number(entry.value).toLocaleString()
                  : Number(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Usage History</CardTitle>
          <CardDescription>Character usage over time</CardDescription>
        </div>
        <Tabs
          defaultValue="bar"
          className="w-[200px]"
          onValueChange={(value) => setChartType(value as "bar" | "line" | "area")}
        >
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="bar">Bar</TabsTrigger>
            <TabsTrigger value="line">Line</TabsTrigger>
            <TabsTrigger value="area">Area</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} padding={{ left: 10, right: 10 }} />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    tickFormatter={(value) => {
                      // Format large numbers with K suffix for thousands
                      return value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value
                    }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, "dataMax"]}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => `${value}%`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="count" yAxisId="left" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Character Count" />
                  <Bar dataKey="percentUsed" yAxisId="right" fill="#f97316" radius={[4, 4, 0, 0]} name="Percent Used" />
                </BarChart>
              ) : chartType === "line" ? (
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} padding={{ left: 10, right: 10 }} />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    tickFormatter={(value) => {
                      // Format large numbers with K suffix for thousands
                      return value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value
                    }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, "dataMax"]}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => `${value}%`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    yAxisId="left"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Character Count"
                  />
                  <Line
                    type="monotone"
                    dataKey="percentUsed"
                    yAxisId="right"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Percent Used"
                  />
                </LineChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} padding={{ left: 10, right: 10 }} />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    tickFormatter={(value) => {
                      // Format large numbers with K suffix for thousands
                      return value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value
                    }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, "dataMax"]}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => `${value}%`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="count"
                    yAxisId="left"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    name="Character Count"
                  />
                  <Area
                    type="monotone"
                    dataKey="percentUsed"
                    yAxisId="right"
                    stroke="#f97316"
                    fill="#f97316"
                    fillOpacity={0.2}
                    name="Percent Used"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No usage data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
