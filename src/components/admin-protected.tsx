"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase/firebaseConfig"
import { onAuthStateChanged } from "firebase/auth"

export default function AdminProtected({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true)
    const [authenticated, setAuthenticated] = useState(false)
    const router = useRouter()

    useEffect(() => {
        // Check if the session cookie exists and if user is admin
        const checkAuth = async () => {
            try {
                // Check session validity
                const sessionResponse = await fetch("/api/auth/check-session", {
                    method: "GET",
                    credentials: "include",
                })

                const sessionData = await sessionResponse.json()

                if (!sessionData.authenticated) {
                    router.push("/login?redirect=/admin")
                    return
                }

                // Check admin status
                const adminResponse = await fetch("/api/auth/check-admin", {
                    method: "GET",
                    credentials: "include",
                })

                const adminData = await adminResponse.json()

                if (!adminData.isAdmin) {
                    router.push("/unauthorized")
                    return
                }

                // Both authenticated and admin
                setAuthenticated(true)
                setLoading(false)
            } catch (error) {
                console.error("Error checking authentication:", error)
                router.push("/login?redirect=/admin")
            }
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                // No user is signed in, redirect to login
                router.push("/login?redirect=/admin")
            } else {
                // User is signed in, check session and admin status
                await checkAuth()
            }
        })

        // Cleanup subscription
        return () => unsubscribe()
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

    if (!authenticated) {
        return null // Will never render because we redirect in the useEffect
    }

    return <>{children}</>
}
