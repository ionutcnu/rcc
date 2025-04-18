"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"

export default function UnauthorizedPage() {
    const router = useRouter()
    const { logout } = useAuth()

    const handleLogout = async () => {
        await logout()
        router.push("/login")
    }

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 z-10">
                <div className="flex flex-col items-center mb-6">
                    <Image src="/logo.svg" width={80} height={80} alt="Logo" priority />
                    <h1 className="text-2xl font-medium text-[#FF6B6B] mt-4">Access Denied</h1>
                </div>

                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>You don't have permission to access the admin area.</span>
                </div>

                <p className="text-center text-gray-600 mb-6">
                    This area is restricted to administrators only. Please contact the site owner if you believe you should have
                    access.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={() => router.push("/")}
                        className="w-full bg-[#5C6AC4] text-white py-2 px-4 rounded-md hover:bg-[#4F5AA9] transition-colors"
                    >
                        Return to Home
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Sign in with a different account
                    </button>
                </div>

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
