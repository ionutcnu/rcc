"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bug, ImageIcon, Webhook, UserCog, RefreshCw, Shield, Search, Database } from "lucide-react"

export default function DebugDashboardPage() {
    const debugTools = [
        {
            title: "Auth Debugger",
            description: "Inspect authentication state, tokens, and session cookies",
            href: "/admin/debug/auth",
            icon: <Shield className="h-8 w-8 text-blue-500" />,
        },
        {
            title: "Test Image",
            description: "Test image loading and proxy functionality",
            href: "/admin/debug/test-image",
            icon: <ImageIcon className="h-8 w-8 text-green-500" />,
        },
        {
            title: "Test Proxy",
            description: "Test API proxy functionality for external resources",
            href: "/admin/debug/test-proxy",
            icon: <Webhook className="h-8 w-8 text-purple-500" />,
        },
        {
            title: "Admin set",
            description: "Grant a normal user admin rights",
            href: "/admin/debug/set-admin",
            icon: <UserCog className="h-8 w-8 text-orange-500" />,
        },
        {
            title: "Force Logout",
            description: "Force a complete logout and session cleanup",
            href: "/admin/debug/force-logout",
            icon: <RefreshCw className="h-8 w-8 text-red-500" />,
        },
        {
            title: "Validate Media",
            description: "Check for broken media links",
            href: "/admin/debug/validate-media",
            icon: <Search className="h-8 w-8 text-orange-500" />,
        },
        {
            title: "Cat API Tester",
            description: "Test and debug the Cat API endpoints",
            href: "/admin/debug/cat-api-tester",
            icon: <Database className="h-8 w-8 text-blue-500" />,
        },
        {
            title: "Debug Logger",
            description: "Test and monitor debugging logs in development",
            href: "/admin/debug/debug-logger",
            icon: <Bug className="h-8 w-8 text-green-500" />,
        },
    ]

    return (
      <div className="container mx-auto py-6">
          <div className="flex items-center justify-between mb-6">
              <div>
                  <h1 className="text-3xl font-bold">Debug Tools</h1>
                  <p className="text-gray-500">Admin-only debugging utilities</p>
              </div>
              <div className="flex items-center space-x-2">
                  <Bug className="h-5 w-5 text-orange-500" />
                  <span className="text-sm font-medium">Development Use Only</span>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {debugTools.map((tool) => (
                <Link key={tool.href} href={tool.href}>
                    <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg font-medium">{tool.title}</CardTitle>
                            {tool.icon}
                        </CardHeader>
                        <CardContent>
                            <CardDescription>{tool.description}</CardDescription>
                        </CardContent>
                    </Card>
                </Link>
              ))}
          </div>
      </div>
    )
}
