"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"

export function useAdminCheck() {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()

    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                // Wait for auth to initialize
                if (authLoading) return

                // Check if user is authenticated
                if (!user) {
                    setIsAdmin(false)
                    router.push("/login?redirect=/admin")
                    return
                }

                // Check admin status from the server
                const response = await fetch("/api/auth/check-admin", {
                    method: "GET",
                    credentials: "include",
                })

                const data = await response.json()
                setIsAdmin(data.isAdmin)

                if (!data.isAdmin) {
                    router.push("/unauthorized")
                }
            } catch (error) {
                console.error("Error checking admin status:", error)
                setIsAdmin(false)
                router.push("/unauthorized")
            } finally {
                setLoading(false)
            }
        }

        checkAdminStatus()
    }, [router, user, authLoading])

    return { isAdmin, loading: loading || authLoading }
}
