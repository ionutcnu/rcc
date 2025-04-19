"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    type User as FirebaseUser,
} from "firebase/auth"
import { auth } from "@/lib/firebase/firebaseConfig"
import { useRouter } from "next/navigation"
import { safeErrorLog, sanitizeError } from "@/lib/utils/security"

// Define types
export type AuthUser = {
    uid: string
    email: string | null
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

// Admin check function - can be expanded to check custom claims or Firestore
async function checkAdminStatus(user: FirebaseUser): Promise<boolean> {
    try {
        // Get fresh token to ensure we have the latest claims
        const idTokenResult = await user.getIdTokenResult(true)

        // Check admin claim in the token
        if (idTokenResult.claims.admin === true) {
            return true
        }

        // If not in token, check with the server
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

    // Set up auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true)

            if (firebaseUser) {
                // User is signed in
                try {
                    // Check if user is admin
                    const adminStatus = await checkAdminStatus(firebaseUser)
                    setIsAdmin(adminStatus)

                    // Create user object
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        isAdmin: adminStatus,
                    })
                } catch (err) {
                    safeErrorLog("User setup error", err)
                    setUser(null)
                    setIsAdmin(false)
                }
            } else {
                // User is signed out
                setUser(null)
                setIsAdmin(false)
            }

            setLoading(false)
        })

        // Clean up subscription
        return () => unsubscribe()
    }, [])

    // Login function
    const login = async (email: string, password: string) => {
        setLoading(true)
        setError(null)

        try {
            // Sign in with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password)

            // Get ID token
            const idToken = await userCredential.user.getIdToken(true)

            // Create session on server
            const response = await fetch("/api/auth/session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-cache",
                },
                body: JSON.stringify({ idToken }),
                credentials: "include",
                cache: "no-store",
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                safeErrorLog("Session creation failed", { status: response.status })
                throw new Error(errorData.error || "Failed to create session")
            }

            // Check if user is admin after successful login
            const adminStatus = await checkAdminStatus(userCredential.user)

            if (!adminStatus) {
                await firebaseSignOut(auth)
                setError("You don't have permission to access the admin area")
                setLoading(false)
                return { success: false, message: "You don't have permission to access the admin area" }
            }

            setIsAdmin(adminStatus)
            setUser({
                uid: userCredential.user.uid,
                email: userCredential.user.email,
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
        try {
            await firebaseSignOut(auth)

            // Clear session cookie
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
                cache: "no-store",
                headers: {
                    "Cache-Control": "no-cache",
                },
            })

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
