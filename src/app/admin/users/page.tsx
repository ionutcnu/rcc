"use client"

import { useState, useEffect } from "react"
import { UserManagement } from "@/components/admin/user-management"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function UsersPage() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Check if the admin API is accessible
        const checkAdminAccess = async () => {
            try {
                const response = await fetch("/api/auth/check-admin", {
                    credentials: "include",
                })

                if (!response.ok) {
                    throw new Error("You don't have permission to access this page")
                }

                setLoading(false)
            } catch (err) {
                setError("Failed to verify admin access")
                setLoading(false)
            }
        }

        checkAdminAccess()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <span className="ml-2">Loading user management...</span>
            </div>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-gray-500">Manage users and their permissions</p>

            <UserManagement />
        </div>
    )
}
