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
        })

        if (!response.ok) {
            return false
        }

        const data = await response.json()
        return data.isAdmin === true
    } catch (error) {
        console.error("Error checking admin status:", error)
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

                    // Get ID token for session
                    const idToken = await firebaseUser.getIdToken(true)

                    // Create session on server
                    const response = await fetch("/api/auth/session", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ idToken }),
                        credentials: "include",
                    })

                    if (!response.ok) {
                        console.error("Failed to create session")
                    }
                } catch (err) {
                    console.error("Error setting up user:", err)
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
            const userCredential = await signInWithEmailAndPassword(auth, email, password)

            // Check if user is admin
            const adminStatus = await checkAdminStatus(userCredential.user)

            if (!adminStatus) {
                await firebaseSignOut(auth)
                setError("You don't have admin privileges")
                setLoading(false)
                return { success: false, message: "You don't have admin privileges" }
            }

            // Get ID token
            const idToken = await userCredential.user.getIdToken()

            // Create session on server
            const response = await fetch("/api/auth/session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ idToken }),
                credentials: "include",
            })

            if (!response.ok) {
                throw new Error("Failed to create session")
            }

            setLoading(false)
            return { success: true }
        } catch (err: any) {
            const errorMessage = err.message || "Failed to login"
            setError(errorMessage)
            setLoading(false)
            return { success: false, message: errorMessage }
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
            })

            router.push("/login")
        } catch (err: any) {
            setError(err.message || "Failed to logout")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, error, login, logout, isAdmin }}>{children}</AuthContext.Provider>
    )
}
