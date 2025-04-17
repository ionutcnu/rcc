"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase/firebaseConfig"

// Create auth context
type AuthContextType = {
    user: User | null
    loading: boolean
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
})

// Hook to use auth context
export function useAuth() {
    return useContext(AuthContext)
}

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user)
            setLoading(false)
        })

        // Cleanup subscription
        return () => unsubscribe()
    }, [])

    return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}
