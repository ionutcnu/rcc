"use client"

import type React from "react"

import { useState, Suspense, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase/firebaseConfig"
import Image from "next/image"
import Link from "next/link"
import ParticlesLogin from "@/components/elements/ParticlesLogin"
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react"

// Create a separate component that uses useSearchParams
function LoginParams() {
    // Import useSearchParams inside the component that's wrapped with Suspense
    const { useSearchParams } = require("next/navigation")
    const searchParams = useSearchParams()
    const redirect = searchParams.get("redirect") || "/admin"
    const message = searchParams.get("message")

    return (
        <>
            <input type="hidden" id="redirect-input" name="redirect" value={redirect} />
            {message && (
                <div className="bg-amber-100 border border-amber-400 text-amber-700 px-4 py-3 rounded mb-4 text-sm flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{message}</span>
                </div>
            )}
        </>
    )
}

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [passwordVisible, setPasswordVisible] = useState(false)
    const [checkingAuth, setCheckingAuth] = useState(true)
    const router = useRouter()

    // Check if user is already logged in
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("User already logged in:", user.email)

                // Check if session is valid
                try {
                    const response = await fetch("/api/auth/check-session", {
                        method: "GET",
                        credentials: "include",
                    })

                    const data = await response.json()

                    if (data.authenticated) {
                        console.log("Session is valid, checking admin status")

                        // Check if user is admin
                        const adminResponse = await fetch("/api/auth/check-admin", {
                            method: "GET",
                            credentials: "include",
                        })

                        const adminData = await adminResponse.json()

                        if (adminData.isAdmin) {
                            console.log("User is admin, redirecting to admin page")
                            // Get the redirect URL from the hidden input
                            const redirectInput = document.getElementById("redirect-input") as HTMLInputElement
                            const redirectUrl = redirectInput ? redirectInput.value : "/admin"

                            // Redirect to admin page
                            window.location.href = redirectUrl
                            return
                        }
                    }
                } catch (error) {
                    console.error("Error checking session:", error)
                }
            }

            setCheckingAuth(false)
        })

        return () => unsubscribe()
    }, [])

    // Handle login form submission
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            // Sign in with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password)
            const user = userCredential.user

            // Get the ID token with force refresh
            const idToken = await user.getIdToken(true)
            console.log("Got ID token, length:", idToken.length)

            // Send the token to your backend to create a session cookie
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ idToken }),
                credentials: "include", // Important for cookies
            })

            const data = await response.json()
            console.log("Login response:", data)

            if (data.success) {
                // Get the redirect URL from the hidden input
                const redirectInput = document.getElementById("redirect-input") as HTMLInputElement
                const redirectUrl = redirectInput ? redirectInput.value : "/admin"

                console.log("Login successful, redirecting to:", redirectUrl)

                // Check if user is admin before redirecting to admin area
                if (redirectUrl.startsWith("/admin") && data.isAdmin === false) {
                    console.log("User is not admin, redirecting to unauthorized page")
                    window.location.href = "/unauthorized"
                } else {
                    // Force a full page reload with absolute URL to ensure cookies are properly set
                    // This is critical for production environments where relative URLs might not work correctly
                    const baseUrl = window.location.origin
                    const absoluteRedirectUrl = redirectUrl.startsWith("/") ? `${baseUrl}${redirectUrl}` : redirectUrl

                    console.log("Redirecting to absolute URL:", absoluteRedirectUrl)
                    window.location.href = absoluteRedirectUrl
                }
            } else {
                setError(data.error || "Failed to create session")
                setLoading(false)
            }
        } catch (err: any) {
            console.error("Login error:", err)
            setError(err.message || "Failed to login")
            setLoading(false)
        }
    }

    if (checkingAuth) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#5C6AC4]" />
                    <p className="mt-4 text-gray-600">Checking authentication status...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-gray-100">
            {/* Particles Background */}
            <ParticlesLogin className="absolute inset-0 z-0" quantity={150} />

            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 z-10">
                <div className="flex flex-col items-center mb-6">
                    <Image src="/logo.svg" width={80} height={80} alt="RCC Logo" priority />
                    <h1 className="text-2xl font-medium text-[#FF6B6B] mt-4">Login to Admin Dashboard</h1>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Wrap useSearchParams in Suspense */}
                <Suspense fallback={null}>
                    <LoginParams />
                </Suspense>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm text-gray-700 mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={passwordVisible ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                                onClick={() => setPasswordVisible(!passwordVisible)}
                            >
                                {passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#5C6AC4] text-white py-2 px-4 rounded-md hover:bg-[#4F5AA9] transition-colors"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/" className="inline-flex items-center text-sm text-[#5C6AC4] hover:text-[#4F5AA9]">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Return to Homepage
                    </Link>
                </div>
            </div>
        </div>
    )
}
