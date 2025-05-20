"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-context"

export default function DebugAuthPage() {
    const { user, loading, isAdmin, logout } = useAuth()
    const [sessionData, setSessionData] = useState<any>(null)
    const [sessionLoading, setSessionLoading] = useState(true)
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    useEffect(() => {
        async function checkSession() {
            try {
                const response = await fetch("/api/auth/check-session", {
                    credentials: "include",
                })
                const data = await response.json()
                setSessionData(data)
            } catch (error) {
                console.error("Error checking session:", error)
                setSessionData({ error: "Failed to fetch session data" })
            } finally {
                setSessionLoading(false)
            }
        }

        if (!loading) {
            checkSession()
        }
    }, [loading])

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true)

            // Call the logout API endpoint
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            })

            // Use the logout method from useAuth hook
            await logout()

            window.location.href = "/login"
        } catch (error) {
            console.error("Logout error:", error)
            setIsLoggingOut(false)
        }
    }

    if (loading || sessionLoading) {
        return <div className="p-8">Loading authentication data...</div>
    }

    return (
      <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>

          <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Client-side Auth</h2>
              <div className="bg-gray-100 p-4 rounded-md overflow-auto">
                  <pre>{JSON.stringify({ user, isAdmin }, null, 2)}</pre>
              </div>
          </div>

          <div>
              <h2 className="text-xl font-semibold mb-2">Server-side Session</h2>
              <div className="bg-gray-100 p-4 rounded-md overflow-auto">
                  <pre>{JSON.stringify(sessionData, null, 2)}</pre>
              </div>
          </div>

          <div className="mt-8 space-x-4">
              <button onClick={() => (window.location.href = "/admin")} className="bg-blue-500 text-white px-4 py-2 rounded">
                  Go to Admin
              </button>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-red-500 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                  {isLoggingOut ? "Logging out..." : "Force Logout"}
              </button>
          </div>
      </div>
    )
}
