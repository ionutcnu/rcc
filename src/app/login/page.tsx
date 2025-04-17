"use client"

import type React from "react"

import { useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase/firebaseConfig"
import Image from "next/image"
import Link from "next/link"
import ParticlesLogin from "@/components/elements/ParticlesLogin"
import { Eye, EyeOff, AlertCircle } from "lucide-react"

// Create a separate component that uses useSearchParams
function LoginRedirect() {
    // Import useSearchParams inside the component that's wrapped with Suspense
    const { useSearchParams } = require("next/navigation")
    const searchParams = useSearchParams()
    const redirect = searchParams.get("redirect") || "/admin"
    const message = searchParams.get("message")

    return (
        <>
            <input type="hidden" name="redirect" value={redirect} />
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
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            // Sign in with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password)
            const user = userCredential.user

            // Get the ID token
            const idToken = await user.getIdToken()

            // Send the token to your backend to create a session cookie
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ idToken }),
            })

            const data = await response.json()

            if (data.success) {
                // Get the redirect URL from the hidden input
                const redirectInput = document.querySelector('input[name="redirect"]') as HTMLInputElement
                const redirectUrl = redirectInput ? redirectInput.value : "/admin"

                // Check if user is admin before redirecting to admin area
                if (redirectUrl.startsWith("/admin")) {
                    // Check admin status
                    const adminCheckResponse = await fetch("/api/auth/check-admin")
                    const adminData = await adminCheckResponse.json()

                    if (!adminData.isAdmin) {
                        // If not admin, redirect to unauthorized page
                        router.push("/unauthorized")
                        return
                    }
                }

                // Redirect to the admin page or the specified redirect URL
                router.push(redirectUrl)
            } else {
                setError("Failed to create session")
                setLoading(false)
            }
        } catch (err: any) {
            setError(err.message || "Failed to login")
            setLoading(false)
        }
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
                    <LoginRedirect />
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
