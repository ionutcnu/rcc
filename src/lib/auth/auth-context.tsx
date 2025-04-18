"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth"
import { auth } from "@/lib/firebase/firebaseConfig"
import { useRouter } from "next/navigation"

// Define types
type AuthUser = {
    uid: string
    email: string | null
    isAdmin: boolean
}

type AuthContextType = {
    user: AuthUser | null
    loading: boolean
    error: string | null
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
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

// Admin emails - hardcoded for simplicity
const ADMIN_EMAILS = ["cioncu_ionut@yahoo.com", "admin@example.com"]

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    // Check if user is admin based on email
    const checkIfAdmin = (email: string | null): boolean => {
        return email ? ADMIN_EMAILS.includes(email.toLowerCase()) : false
    }

    // Set up auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true)

            if (firebaseUser) {
                // User is signed in
                const isAdmin = checkIfAdmin(firebaseUser.email)

                // Create user object
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    isAdmin,
                })

                // Get ID token for session
                try {
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
                    console.error("Error creating session:", err)
                }
            } else {
                // User is signed out
                setUser(null)
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
            const isAdmin = checkIfAdmin(userCredential.user.email)

            if (!isAdmin) {
                await firebaseSignOut(auth)
                setError("You don't have admin privileges")
                setLoading(false)
                return
            }

            // User will be set by the onAuthStateChanged listener
        } catch (err: any) {
            setError(err.message || "Failed to login")
            setLoading(false)
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

    return <AuthContext.Provider value={{ user, loading, error, login, logout }}>{children}</AuthContext.Provider>
}
