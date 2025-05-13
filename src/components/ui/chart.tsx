"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type ChartContextValue = {
  config: Record<string, { label: string; color: string }>
}

const ChartContext = React.createContext<ChartContextValue | null>(null)

function useChartContext() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChartContext must be used within a ChartProvider")
  }
  return context
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: Record<string, { label: string; color: string }>
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ config, className, children, ...props }, ref) => {
    // Create CSS variables for colors
    const style = React.useMemo(() => {
      return Object.entries(config).reduce(
        (acc, [key, value]) => {
          acc[`--color-${key}`] = value.color
          return acc
        },
        {} as Record<string, string>,
      )
    }, [config])

    return (
      <ChartContext.Provider value={{ config }}>
        <div ref={ref} className={cn("", className)} style={style} {...props}>
          {children}
        </div>
      </ChartContext.Provider>
    )
  },
)
ChartContainer.displayName = "ChartContainer"

// Define the tooltip props interface to match recharts expected props
interface TooltipProps {
  active?: boolean
  payload?: Array<{
    value: any
    name: string
    dataKey: string
    color?: string
    fill?: string
  }>
  label?: string
}

interface ChartTooltipProps {
  className?: string
  content?: React.ReactNode
}

const ChartTooltip = React.forwardRef<HTMLDivElement, ChartTooltipProps>(({ className, content, ...props }, ref) => {
  return content
})
ChartTooltip.displayName = "ChartTooltip"

interface ChartTooltipContentProps extends React.HTMLAttributes<HTMLDivElement>, TooltipProps {}

const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  ({ className, active, payload, label, ...props }, ref) => {
    const { config } = useChartContext()

    return (
      <div ref={ref} className={cn("border bg-background px-3 py-2 text-sm shadow-sm", className)} {...props}>
        {active && payload && payload.length > 0 && (
          <div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">{label}</div>
              </div>
              <div className="grid gap-1">
                {payload.map((item, index) => {
                  const dataKey = item.dataKey
                  const configItem = config[dataKey]
                  return (
                    <div key={index} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill || item.color }} />
                        <div className="text-xs text-muted-foreground">{configItem?.label || dataKey}</div>
                      </div>
                      <div className="text-xs font-medium">
                        {typeof item.value === "number"
                          ? dataKey.includes("percent")
                            ? `${item.value.toFixed(1)}%`
                            : item.value.toLocaleString()
                          : item.value}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  },
)
ChartTooltipContent.displayName = "ChartTooltipContent"

export { ChartContainer, ChartTooltip, ChartTooltipContent }
