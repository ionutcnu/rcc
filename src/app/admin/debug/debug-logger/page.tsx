"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { devLog, devError, devWarn, devInfo, alwaysLog } from "@/lib/utils/debug-logger"

export default function DebugLoggerPage() {
  const [logs, setLogs] = useState<Array<{ type: string; message: string }>>([])

  // Client-side logging functions that call the server utilities
  const logMessage = (type: string, message: string) => {
    // Add to UI logs
    setLogs((prev) => [...prev, { type, message }])

    // Call appropriate logger function
    switch (type) {
      case "log":
        devLog(message)
        break
      case "error":
        devError(message)
        break
      case "warn":
        devWarn(message)
        break
      case "info":
        devInfo(message)
        break
      case "important":
        alwaysLog(message)
        break
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Debug Logger Tester</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Logger Functions</CardTitle>
            <CardDescription>Click buttons to test different logging functions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => logMessage("log", `Standard log at ${new Date().toISOString()}`)}
                variant="outline"
              >
                Test devLog
              </Button>

              <Button
                onClick={() => logMessage("error", `Error log at ${new Date().toISOString()}`)}
                variant="destructive"
              >
                Test devError
              </Button>

              <Button
                onClick={() => logMessage("warn", `Warning log at ${new Date().toISOString()}`)}
                variant="default"
                className="bg-yellow-500 hover:bg-yellow-600"
              >
                Test devWarn
              </Button>

              <Button
                onClick={() => logMessage("info", `Info log at ${new Date().toISOString()}`)}
                variant="outline"
                className="border-blue-500 text-blue-500 hover:bg-blue-50"
              >
                Test devInfo
              </Button>

              <Button
                onClick={() => logMessage("important", `IMPORTANT log at ${new Date().toISOString()}`)}
                variant="default"
                className="col-span-2"
              >
                Test alwaysLog
              </Button>
            </div>

            <Button onClick={clearLogs} variant="outline" className="w-full mt-4">
              Clear Log Display
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log Output</CardTitle>
            <CardDescription>Logs will appear here (also check browser console)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-100 p-4 rounded-md h-[400px] overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-slate-500 italic">No logs yet. Click buttons to generate logs.</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`mb-2 ${getLogStyle(log.type)}`}>
                    <span className="font-bold">[{log.type.toUpperCase()}]</span> {log.message}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Debug Logger Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="usage">
            <TabsList>
              <TabsTrigger value="usage">Usage</TabsTrigger>
              <TabsTrigger value="environment">Environment</TabsTrigger>
            </TabsList>
            <TabsContent value="usage" className="p-4">
              <h3 className="text-lg font-medium mb-2">How to use the Debug Logger</h3>
              <pre className="bg-slate-100 p-4 rounded-md overflow-x-auto">
                {`// Import the logger functions
import { devLog, devError, devWarn, devInfo, alwaysLog } from '@/lib/utils/debug-logger'

// Use them in your code
devLog('This only shows in development')
devError('Error message in development')
devWarn('Warning message in development')
devInfo('Info message in development')
alwaysLog('This shows in ALL environments')`}
              </pre>
            </TabsContent>
            <TabsContent value="environment" className="p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Current Environment</h3>
                  <p className="text-slate-600">
                    {process.env.NODE_ENV === "production"
                      ? "Production - Only alwaysLog() will output to console"
                      : "Development - All logger functions will output to console"}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Debug Flag</h3>
                  <p className="text-slate-600">
                    {process.env.DEBUG === "true" ? "Debug mode is ENABLED" : "Debug mode is DISABLED"}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to get the appropriate style for each log type
function getLogStyle(type: string): string {
  switch (type) {
    case "error":
      return "text-red-600"
    case "warn":
      return "text-yellow-600"
    case "info":
      return "text-blue-600"
    case "important":
      return "text-purple-600 font-bold"
    default:
      return "text-slate-800"
  }
}
