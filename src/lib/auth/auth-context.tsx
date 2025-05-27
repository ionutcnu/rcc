"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/services/authService"
import { safeErrorLog, sanitizeError } from "@/lib/utils/security"

// Define types
export type AuthUser = {
    uid: string
    email: string | null
    photoURL?: string | null
    isAdmin: boolean
    token?: string // Add token property here
}

type AuthContextType = {
    user: AuthUser | null
    loading: boolean
    error: string | null
    login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
    logout: () => Promise<void>
    isAdmin: boolean
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null)

// Hook to use the auth context
export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}

// Admin check function - uses the server API to check admin status
async function checkAdminStatus(): Promise<boolean> {
    try {
        // Check with the server
        const response = await fetch("/api/auth/check-admin", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: {
                "Cache-Control": "no-cache",
            },
        })

        if (!response.ok) {
            return false
        }

        const data = await response.json()
        return data.isAdmin === true
    } catch (error) {
        safeErrorLog("Admin status check failed", error)
        return false
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const router = useRouter()

    // Check session status on mount and periodically
    useEffect(() => {
        const checkSession = async () => {
            setLoading(true)
            try {
                const sessionData = await authService.checkSession()

                if (sessionData.authenticated) {
                    // User is signed in
                    // Check if user is admin
                    const adminStatus = await checkAdminStatus()
                    setIsAdmin(adminStatus)

                    // Create user object
                    setUser({
                        uid: sessionData.uid || "",
                        email: sessionData.email || null,
                        isAdmin: adminStatus,
                    })
                } else {
                    // User is signed out
                    setUser(null)
                    setIsAdmin(false)
                }
            } catch (err) {
                safeErrorLog("Session check error", err)
                setUser(null)
                setIsAdmin(false)
            } finally {
                setLoading(false)
            }
        }

        // Check immediately on mount
        checkSession()

        // Set up periodic checks (every 5 minutes)
        const intervalId = setInterval(checkSession, 5 * 60 * 1000)

        // Clean up interval on unmount
        return () => clearInterval(intervalId)
    }, [])

    // Login function
    const login = async (email: string, password: string) => {
        setLoading(true)
        setError(null)

        try {
            // Sign in using the authService
            const result = await authService.login(email, password)

            if (!result.success) {
                setError(result.message || "Failed to login")
                setLoading(false)
                return { success: false, message: result.message || "Failed to login" }
            }

            // Fetch the session data after successful login
            const sessionData = await authService.checkSession()

            // Check if user is admin
            const adminStatus = await checkAdminStatus()

            if (!adminStatus) {
                await authService.logout()
                setError("You don't have permission to access the admin area")
                setLoading(false)
                return { success: false, message: "You don't have permission to access the admin area" }
            }

            setIsAdmin(adminStatus)
            setUser({
                uid: sessionData.uid || "",
                email: sessionData.email || null,
                isAdmin: adminStatus,
            })

            setLoading(false)
            return { success: true }
        } catch (err: any) {
            const sanitizedError = sanitizeError(err)
            safeErrorLog("Authentication error", err)
            setError(sanitizedError.message)
            setLoading(false)
            return { success: false, message: sanitizedError.message }
        }
    }

    // Logout function
    const logout = async () => {
        setLoading(true)

        // Immediately clear user state to update UI
        setUser(null)
        setIsAdmin(false)

        try {
            const success = await authService.logout()

            if (success) {
                // Force a full page reload to clear any cached state
                window.location.replace("/login")
            } else {
                // If server logout failed, show error
                setError("Server logout failed. You have been logged out locally.")
                // Force reload anyway
                window.location.replace("/login")
            }
        } catch (err: any) {
            safeErrorLog("Logout error", err)
            setError("Failed to log out properly. You have been logged out locally.")

            // Force reload anyway
            window.location.replace("/login")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, error, login, logout, isAdmin }}>{children}</AuthContext.Provider>
    )
}
