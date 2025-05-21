"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminProtected({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    // We need to handle the case where this component might be used outside of AuthProvider
    useEffect(() => {
        // Check if the user is authenticated on the client side
        const checkAuth = async () => {
            try {
                // Use fetch directly instead of useAuth hook
                const response = await fetch("/api/auth/check-session", {
                    method: "GET",
                    credentials: "include",
                })

                if (!response.ok) {
                    throw new Error(`Session check failed: ${response.status}`)
                }

                const data = await response.json()

                if (!data.authenticated) {
                    // No user is signed in, redirect to login
                    router.push("/login?redirect=/admin")
                    if (process.env.NODE_ENV !== "production") {
                        console.error("Authentication verification failed: No user")
                    }
                    return
                }

                // Check if user is admin
                const adminResponse = await fetch("/api/auth/check-admin", {
                    method: "GET",
                    credentials: "include",
                })

                if (!adminResponse.ok) {
                    throw new Error(`Admin check failed: ${adminResponse.status}`)
                }

                const adminData = await adminResponse.json()

                if (!adminData.isAdmin) {
                    // User is not an admin, redirect to home
                    router.push("/")
                    console.error("Authentication verification failed: Not admin")
                    return
                }

                // User is authenticated and is an admin
                setLoading(false)
            } catch (error) {
                console.error("Auth check error:", error)
                router.push("/login?redirect=/admin&error=auth_failed")
            }
        }

        checkAuth()
    }, [router])

    if (loading) {
        return (
          <div className="flex min-h-screen items-center justify-center">
              <div className="text-center">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-lg text-orange-600">Loading...</p>
              </div>
          </div>
        )
    }

    return <>{children}</>
}
