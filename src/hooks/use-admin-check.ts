"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase/firebaseConfig"

export function useAdminCheck() {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                // Check if user is authenticated
                const user = auth.currentUser
                if (!user) {
                    setIsAdmin(false)
                    router.push("/login?redirect=/admin")
                    return
                }

                // Get ID token with fresh claims
                const idToken = await user.getIdTokenResult(true)

                // Check admin claim
                if (idToken.claims.admin === true) {
                    setIsAdmin(true)
                } else {
                    // If not in token, check with the server
                    const response = await fetch("/api/auth/check-admin", {
                        method: "GET",
                        credentials: "include",
                    })

                    const data = await response.json()
                    setIsAdmin(data.isAdmin)

                    if (!data.isAdmin) {
                        router.push("/unauthorized")
                    }
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
    }, [router])

    return { isAdmin, loading }
}
