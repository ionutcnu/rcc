"use client"

import { type ReactNode, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function ProtectedRoute({
                                           children,
                                           adminOnly = true,
                                       }: {
    children: ReactNode
    adminOnly?: boolean
}) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login")
            } else if (adminOnly && !user.isAdmin) {
                router.push("/unauthorized")
            }
        }
    }, [user, loading, router, adminOnly])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <span className="ml-2">Loading...</span>
            </div>
        )
    }

    if (!user) {
        return null
    }

    if (adminOnly && !user.isAdmin) {
        return null
    }

    return <>{children}</>
}
