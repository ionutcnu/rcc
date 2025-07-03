"use client"

import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Loader2 } from 'lucide-react'
import { useState } from "react"
import { cn } from "@/lib/utils"

interface LogoutButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
}

export default function LogoutButton({ className, ...props }: LogoutButtonProps) {
    const { logout } = useAuth()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            await logout()
        } finally {
            setIsLoggingOut(false)
        }
    }

    return (
        <Button
            onClick={handleLogout}
            variant="destructive"
            className={cn("bg-red-500 hover:bg-red-600 text-white", className)}
            disabled={isLoggingOut}
            {...props}
        >
            {isLoggingOut ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging out...
                </>
            ) : (
                "Logout"
            )}
        </Button>
    )
}