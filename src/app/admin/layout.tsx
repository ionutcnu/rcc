import type React from "react"
import { AdminSidebar } from "@/components/admin/sidebar"
import { CatPopupProvider } from "@/components/CatPopupProvider"
import AdminProtected from "@/components/admin-protected"

export default function AdminLayout({
                                        children,
                                    }: {
    children: React.ReactNode
}) {
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
}
