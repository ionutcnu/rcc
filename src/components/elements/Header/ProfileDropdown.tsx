"use client"

import type { ReactElement } from "react"
import { auth } from "@/lib/firebase/firebaseConfig"
import { useRouter } from "next/navigation"
import { GiCat, GiPawPrint, GiExitDoor } from "react-icons/gi"
import { MdOutlineDashboard } from "react-icons/md"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface ProfileDropdownProps {
    icon: ReactElement
}

export default function ProfileDropdown({ icon }: ProfileDropdownProps) {
    const router = useRouter()

    const handleLogout = async () => {
        try {
            // Sign out from Firebase client
            await auth.signOut()

            // Call server action to revoke session cookie
            const response = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            })

            // Force a full page reload to clear any cached state
            window.location.href = "/login"
        } catch (error) {
            console.error("Logout error:", error)
            // Force reload as a fallback
            window.location.href = "/login"
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex items-center space-x-2 bg-orange-100 rounded-full p-2 hover:bg-orange-200 transition-colors"
                >
                    {icon}
                    <span className="text-sm font-medium text-orange-700">Cat Profile</span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 bg-amber-50 border border-orange-200">


                <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center cursor-pointer">
                        <MdOutlineDashboard className="w-5 h-5 mr-2 text-orange-600" />
                        <span>Admin Dashboard</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleLogout} className="flex items-center cursor-pointer">
                    <GiExitDoor className="w-5 h-5 mr-2 text-orange-600" />
                    <span>Log out</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-orange-200" />

                {auth.currentUser?.email && (
                    <div className="px-2 py-1.5 text-xs text-orange-600 flex items-center">
                        <GiPawPrint className="mr-1.5" />
                        {auth.currentUser.email}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
