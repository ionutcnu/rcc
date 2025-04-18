"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase/firebaseConfig"
import { onAuthStateChanged } from "firebase/auth"

export default function AdminProtected({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        // Check if the user is authenticated on the client side
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                // No user is signed in, redirect to login
                router.push("/login?redirect=/admin")
                return
            }

            // User is signed in, we can assume they're an admin since the server-side check passed
            setLoading(false)
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

    return <>{children}</>
}
