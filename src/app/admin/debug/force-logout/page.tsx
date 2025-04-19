"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase/firebaseConfig"

export default function ForceLogoutPage() {
    const router = useRouter()

    useEffect(() => {
        const logout = async () => {
            try {
                // Sign out from Firebase client
                await auth.signOut()

                // Call server action to revoke session cookie
                await fetch("/api/auth/logout", {
                    method: "POST",
                    credentials: "include",
                    cache: "no-store",
                    headers: {
                        "Cache-Control": "no-cache",
                    },
                })

                // Clear any client-side storage
                localStorage.clear()
                sessionStorage.clear()

                // Force clear all cookies
                document.cookie.split(";").forEach((c) => {
                    const cookie = c.trim()
                    const eqPos = cookie.indexOf("=")
                    const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie
                    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
                })

                // Wait a moment to ensure everything is cleared
                await new Promise((resolve) => setTimeout(resolve, 1000))

                // Force reload the page to clear any cached state
                window.location.href = "/login"
            } catch (error) {
                console.error("Force logout error:", error)
                // Force reload as a fallback
                window.location.href = "/login"
            }
        }

        logout()
    }, [router])

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Logging you out...</h1>
                <p>Please wait while we clear your session.</p>
            </div>
        </div>
    )
}
