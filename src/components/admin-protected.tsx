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
        // Check if the session cookie exists
        const checkCookie = async () => {
            try {
                // Make a request to a special endpoint that checks if the session is valid
                const response = await fetch("/api/auth/check-session", {
                    method: "GET",
                    credentials: "include",
                })

                const data = await response.json()
                return data.authenticated
            } catch (error) {
                console.error("Error checking session:", error)
                return false
            }
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                // No user is signed in, redirect to login
                router.push("/login?redirect=/admin")
            } else {
                // User is signed in, but also check the cookie
                const cookieValid = await checkCookie()

                if (!cookieValid) {
                    // Cookie is invalid, sign out from Firebase and redirect
                    await auth.signOut()
                    router.push("/login?redirect=/admin")
                } else {
                    // Both Firebase auth and cookie are valid
                    setAuthenticated(true)
                    setLoading(false)
                }
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
