"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [passwordVisible, setPasswordVisible] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectPath = searchParams.get("redirect") || "/admin"

    const { login, loading, error: authError } = useAuth()
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsSubmitting(true)

        try {
            const result = await login(email, password)

            if (result.success) {
                router.push(redirectPath)
            } else {
                setError(result.message || "Failed to login")
            }
        } catch (err: any) {
            console.error("Login error:", err)
            setError(err.message || "An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 z-10">
                <div className="flex flex-col items-center mb-6">
                    <Image src="/logo.svg" width={80} height={80} alt="Logo" priority />
                    <h1 className="text-2xl font-medium text-[#FF6B6B] mt-4">Login to Admin Dashboard</h1>
                </div>

                {(error || authError) && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{error || authError}</span>
                    </div>
                )}

                {searchParams.get("message") && (
                    <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4 text-sm">
                        {searchParams.get("message")}
                    </div>
                )}

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
                        disabled={loading || isSubmitting}
                        className="w-full bg-[#5C6AC4] text-white py-2 px-4 rounded-md hover:bg-[#4F5AA9] transition-colors disabled:bg-gray-400"
                    >
                        {loading || isSubmitting ? (
                            <div className="flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Logging in...
                            </div>
                        ) : (
                            "Login"
                        )}
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
