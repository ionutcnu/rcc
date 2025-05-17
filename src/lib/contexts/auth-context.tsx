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
                    setUser({
                        uid: sessionData.uid,
                        email: sessionData.email,
                        isAdmin: sessionData.isAdmin,
                        photoURL: sessionData.photoURL,
                    })
                    setIsAdmin(sessionData.isAdmin)
                } else {
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
            const result = await authService.login(email, password)

            if (result.success) {
                // Fetch the session data after successful login
                const sessionData = await authService.checkSession()

                if (!sessionData.isAdmin) {
                    await authService.logout()
                    setError("You don't have permission to access the admin area")
                    setLoading(false)
                    return { success: false, message: "You don't have permission to access the admin area" }
                }

                setUser({
                    uid: sessionData.uid,
                    email: sessionData.email,
                    isAdmin: sessionData.isAdmin,
                    photoURL: sessionData.photoURL,
                })
                setIsAdmin(sessionData.isAdmin)
                setLoading(false)
                return { success: true }
            } else {
                setError(result.message || "Login failed")
                setLoading(false)
                return { success: false, message: result.message }
            }
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
        try {
            await authService.logout()
            setUser(null)
            setIsAdmin(false)
            router.push("/login")
        } catch (err: any) {
            safeErrorLog("Logout error", err)
            setError("Failed to log out. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
      <AuthContext.Provider value={{ user, loading, error, login, logout, isAdmin }}>{children}</AuthContext.Provider>
    )
}
