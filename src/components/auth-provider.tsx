"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/services/authService"

type User = {
    uid: string
    email: string | null
    isAdmin: boolean
}

type AuthContextType = {
    user: User | null
    loading: boolean
    error: string | null
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
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
                    })
                } else {
                    setUser(null)
                }
            } catch (err) {
                console.error("Session check error:", err)
                setUser(null)
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
                    setError("You don't have admin privileges")
                    setLoading(false)
                    return
                }

                setUser({
                    uid: sessionData.uid,
                    email: sessionData.email,
                    isAdmin: sessionData.isAdmin,
                })
            } else {
                setError(result.message || "Failed to login")
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    const logout = async () => {
        setLoading(true)
        try {
            await authService.logout()
            setUser(null)
            router.push("/login")
        } catch (err: any) {
            setError(err.message || "Failed to logout")
        } finally {
            setLoading(false)
        }
    }

    return <AuthContext.Provider value={{ user, loading, error, login, logout }}>{children}</AuthContext.Provider>
}
