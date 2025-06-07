"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, AlertCircle, Loader2, Shield } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"

// Import the logger at the top of the file
import { safeErrorLog } from "@/lib/utils/logger"

// Subtle geometric shapes for background
type GeometricShapeProps = {
    className?: string
    size?: number
    type?: "circle" | "triangle"
}
const GeometricShape: React.FC<GeometricShapeProps> = ({ className = "", size = 40, type = "circle" }) => {
    if (type === "circle") {
        return (
          <svg className={className} width={size} height={size} viewBox="0 0 100 100" fill="currentColor">
              <circle cx="50" cy="50" r="20" fill="currentColor" opacity="0.6"/>
              <circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.8"/>
          </svg>
        )
    }

    return (
      <svg className={className} width={size} height={size} viewBox="0 0 100 100" fill="currentColor">
          <polygon points="50,20 80,70 20,70" fill="currentColor" opacity="0.6"/>
          <polygon points="50,30 70,60 30,60" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.8"/>
      </svg>
    )
}

type FloatingElement = {
    id: number
    x: number
    y: number
    size: number
    duration: number
    delay: number
    type: "circle" | "triangle"
}

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [passwordVisible, setPasswordVisible] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [floatingElements, setFloatingElements] = useState<FloatingElement[]>([])

    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectPath = searchParams.get("redirect") || "/admin"

    const { login, loading, error: authError } = useAuth()
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        setMounted(true)

        // Create subtle floating elements
        const elements: FloatingElement[] = Array.from({ length: 8 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 25 + Math.random() * 15,
            duration: 20 + Math.random() * 10,
            delay: i * 3,
            type: (i % 2 === 0 ? 'circle' : 'triangle') as "circle" | "triangle"
        }))
        setFloatingElements(elements)
    }, [])

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
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
            safeErrorLog("Login process error", err)
            setError("An unexpected error occurred. Please try again later.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!mounted) {
        return (
          <div className="relative flex items-center justify-center min-h-screen bg-gray-100">
              <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                  <div className="animate-pulse">
                      <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded mb-6"></div>
                      <div className="space-y-4">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-10 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-10 bg-gray-200 rounded"></div>
                          <div className="h-10 bg-gray-200 rounded"></div>
                      </div>
                  </div>
              </div>
          </div>
        )
    }

    return (
      <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          {/* Subtle Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
              {floatingElements.map((element) => (
                <div
                  key={element.id}
                  className="absolute text-slate-300 opacity-40"
                  style={{
                      left: `${element.x}%`,
                      top: `${element.y}%`,
                      animationDelay: `${element.delay}s`,
                      animationDuration: `${element.duration}s`
                  }}
                >
                    <div className="animate-pulse" style={{ animationDelay: `${element.delay * 0.5}s` }}>
                        <GeometricShape size={element.size} type={element.type} />
                    </div>
                </div>
              ))}

              {/* Gradient Orbs */}
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-slate-200/30 to-blue-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          {/* Main Login Card */}
          <div className="relative w-full max-w-md transform transition-all duration-700 ease-out animate-[slideUp_0.8s_ease-out] z-10">
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/30 hover:shadow-3xl transition-all duration-500 hover:transform hover:scale-[1.01]">
                  {/* Header */}
                  <div className="flex flex-col items-center mb-8 animate-[fadeIn_1s_ease-out_0.3s_both]">
                      <div className="relative mb-4 group">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                          <div className="relative">
                              <Image
                                src="/logo.svg"
                                width={80}
                                height={80}
                                alt="Logo"
                                priority
                                className="transform transition-transform duration-500 hover:scale-110 hover:rotate-3"
                              />
                          </div>
                      </div>
                      <h1 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent text-center mb-2">
                          Login to Admin Dashboard
                      </h1>
                      <p className="text-gray-500 text-sm text-center">
                          Secure access to your management portal
                      </p>
                  </div>

                  {/* Error Messages */}
                  {(error || authError) && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center animate-[shake_0.5s_ease-in-out] shadow-sm">
                        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{error || authError}</span>
                    </div>
                  )}

                  {searchParams.get("message") && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl mb-6 text-sm animate-[slideIn_0.5s_ease-out]">
                        {searchParams.get("message")}
                    </div>
                  )}

                  {/* Login Form */}
                  <form onSubmit={handleLogin} className="space-y-6">
                      {/* Email Field */}
                      <div className="group animate-[slideIn_0.6s_ease-out_0.5s_both]">
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors duration-300">
                              Email Address
                          </label>
                          <div className="relative">
                              <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300 bg-white/90 backdrop-blur-sm"
                                placeholder="Enter your email"
                              />
                              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-indigo-500/0 group-focus-within:from-blue-500/5 group-focus-within:to-indigo-500/5 transition-all duration-500 pointer-events-none"></div>
                          </div>
                      </div>

                      {/* Password Field */}
                      <div className="group animate-[slideIn_0.6s_ease-out_0.6s_both]">
                          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors duration-300">
                              Password
                          </label>
                          <div className="relative">
                              <input
                                id="password"
                                type={passwordVisible ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300 bg-white/90 backdrop-blur-sm"
                                placeholder="Enter your password"
                              />
                              <button
                                type="button"
                                className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-blue-600 transition-colors duration-300 hover:scale-110 transform"
                                onClick={() => setPasswordVisible(!passwordVisible)}
                              >
                                  {passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                          </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={loading || isSubmitting}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] animate-[slideIn_0.6s_ease-out_0.7s_both] group"
                      >
                          {loading || isSubmitting ? (
                            <div className="flex items-center justify-center">
                                <Loader2 className="h-5 w-5 animate-spin mr-3" />
                                <span>Logging in...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                <span>Login</span>
                            </div>
                          )}
                      </button>
                  </form>

                  {/* Footer */}
                  <div className="mt-8 text-center animate-[fadeIn_1s_ease-out_0.8s_both]">
                      <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors duration-300 group">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition-transform duration-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          <span className="group-hover:underline">Return to Homepage</span>
                      </Link>
                  </div>
              </div>
          </div>

          <style jsx>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
            `}</style>
      </div>
    )
}