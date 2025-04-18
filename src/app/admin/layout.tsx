import type React from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/sidebar"
import { CatPopupProvider } from "@/components/CatPopupProvider"
import AdminProtected from "@/components/admin-protected"
import { isUserAdmin } from "@/lib/auth/admin-check"
import { admin } from "@/lib/firebase/admin"

export default async function AdminLayout({
                                              children,
                                          }: {
    children: React.ReactNode
}) {
    // Server-side admin check
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")?.value

    // If no session cookie, redirect to login
    if (!sessionCookie) {
        redirect("/login?redirect=/admin")
    }

    try {
        // Verify the session cookie
        const decodedClaims = await admin.auth.verifySessionCookie(sessionCookie, true)

        // Check if the user has admin privileges
        const isAdmin = await isUserAdmin(decodedClaims.uid)

        if (!isAdmin) {
            // If not an admin, redirect to unauthorized page
            redirect("/unauthorized")
        }

        // If user is authenticated and is an admin, render the layout with client-side protection
        return (
            <AdminProtected>
                <CatPopupProvider>
                    <div className="flex min-h-screen bg-gray-50">
                        <AdminSidebar />
                        <main className="flex-1 overflow-auto p-6">{children}</main>
                    </div>
                </CatPopupProvider>
            </AdminProtected>
        )
    } catch (error) {
        console.error("Admin layout authentication error:", error)
        // If verification fails, redirect to login
        redirect("/login?redirect=/admin")
    }
}
