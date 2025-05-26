"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { loginUser, logoutUser, getCurrentUser } from "@/lib/actions/auth-actions"

interface AuthContextProps {
    user: {
        uid: string | null
        email: string | null
        photoURL: string | null
        isAdmin: boolean
    } | null
    isAdmin: boolean
    login: (formData: any) => Promise<{ success: boolean; message?: string }>
    logout: () => void
    loading: boolean
    error: string | null
}

const AuthContext = createContext<AuthContextProps>({
    user: null,
    isAdmin: false,
    login: async () => ({ success: false }),
    logout: () => {},
    loading: false,
    error: null,
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthContextProps["user"]>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                const result = await getCurrentUser()

                if (result.user) {
                    setUser({
                        uid: result.user.uid,
                        email: result.user.email || null,
                        photoURL: null,
                        isAdmin: result.user.isAdmin,
                    })
                    setIsAdmin(result.user.isAdmin)
                } else {
                    setUser(null)
                    setIsAdmin(false)
                }
            } catch (err: any) {
                console.error("Auth check error:", err)
                setUser(null)
                setIsAdmin(false)
            } finally {
                setLoading(false)
            }
        }

        checkAuthentication()
    }, [])

    const login = async (formData: any) => {
        setLoading(true)
        setError(null)

        try {
            const result = await loginUser(formData)

            if (result.success && result.user) {
                setUser({
                    uid: result.user.uid,
                    email: result.user.email || null,
                    photoURL: null,
                    isAdmin: result.user.isAdmin,
                })
                setIsAdmin(result.user.isAdmin)
                return { success: true }
            } else {
                setError(result.message || "Login failed")
                return { success: false, message: result.message }
            }
        } catch (err: any) {
            setError(err.message || "Login failed")
            return { success: false, message: err.message }
        } finally {
            setLoading(false)
        }
    }

    const logout = async () => {
        setLoading(true)
        try {
            await logoutUser()
            setUser(null)
            setIsAdmin(false)
        } catch (err: any) {
            setError(err.message || "Logout failed")
        } finally {
            setLoading(false)
        }
    }

    const value = {
        user,
        isAdmin,
        login,
        logout,
        loading,
        error,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
