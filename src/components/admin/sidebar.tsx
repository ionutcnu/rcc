"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Cat, ImageIcon, Settings, ExternalLink, Users, FileText, ChevronRight, LogOut, LayoutDashboard, Bug, ChevronLeft } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import LogoutButton from "@/components/admin/logout-button"
import { useAuth } from "@/lib/auth/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsCollapsed(true)
      }
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  const navItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      description: "Overview of your site",
    },
    {
      title: "Cats",
      href: "/admin/cats",
      icon: Cat,
      description: "Manage cat profiles",
    },
    {
      title: "Media Manager",
      href: "/admin/media",
      icon: ImageIcon,
      description: "Manage images and videos",
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
      description: "Site configuration",
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: Users,
      description: "Manage user accounts",
    },
    {
      title: "Logs",
      href: "/admin/logs",
      icon: FileText,
      description: "View system logs",
    },
    {
      title: "Debug",
      href: "/admin/debug",
      icon: Bug,
      description: "Debugging tools",
    },
  ]

  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : "U"

  return (
      <TooltipProvider delayDuration={300}>
        <div
            className={cn(
                "h-screen bg-gradient-to-b from-white to-gray-50 border-r transition-all duration-300 ease-in-out flex flex-col shadow-sm",
                isCollapsed ? "w-[70px]" : "w-[240px]",
            )}
        >
          <div
              className={cn("flex items-center p-4 border-b bg-white", isCollapsed ? "justify-center" : "justify-between")}
          >
            {!isCollapsed && (
                <div className="flex items-center gap-2">
                  <Cat size={24} className="text-orange-500" />
                  <h1 className="font-bold text-xl bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                    Cat Admin
                  </h1>
                </div>
            )}
            {isCollapsed && <Cat size={24} className="text-orange-500" />}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn("rounded-full hover:bg-orange-100 hover:text-orange-500", isCollapsed ? "ml-0" : "ml-auto")}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </Button>
          </div>

          <nav className="p-2 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <div className="space-y-1 py-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href))

                return (
                    <Tooltip key={item.href} delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Link
                            href={item.href}
                            className={cn(
                                "flex items-center py-2.5 px-3 rounded-lg transition-all",
                                isActive
                                    ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md"
                                    : "text-gray-700 hover:bg-orange-100/50 hover:text-orange-600",
                                isCollapsed ? "justify-center" : "space-x-3",
                            )}
                        >
                          <item.icon size={20} className={cn(isActive ? "text-white" : "")} />
                          {!isCollapsed && <span className="font-medium">{item.title}</span>}
                        </Link>
                      </TooltipTrigger>
                      {isCollapsed && (
                          <TooltipContent side="right" className="border-orange-100">
                            {item.title}
                            <p className="text-xs text-gray-500">{item.description}</p>
                          </TooltipContent>
                      )}
                    </Tooltip>
                )
              })}
            </div>
          </nav>

          {/* Return to Homepage button - positioned between nav and footer */}
          <div className="px-2 pb-2 mt-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                    href="/"
                    className={cn(
                        "flex items-center py-2.5 px-3 rounded-lg transition-all text-gray-700 hover:bg-orange-100/50 hover:text-orange-600 border border-dashed border-gray-200",
                        isCollapsed ? "justify-center" : "space-x-3",
                    )}
                >
                  <ExternalLink size={18} />
                  {!isCollapsed && <span className="font-medium">Return to Site</span>}
                </Link>
              </TooltipTrigger>
              {isCollapsed && <TooltipContent side="right">Return to Site</TooltipContent>}
            </Tooltip>
          </div>

          <div className={cn("border-t bg-white", isCollapsed ? "p-2" : "p-4")}>
            {!isCollapsed ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 border-2 border-orange-100">
                      <AvatarImage src={user?.photoURL ?? ""} alt={user?.email || "User"} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-500 to-pink-500 text-white">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium line-clamp-1">{user?.email}</p>
                      <p className="text-xs text-gray-500">Administrator</p>
                    </div>
                  </div>
                  <LogoutButton className="w-full bg-orange-500 hover:bg-orange-600 text-white" />
                </div>
            ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-2">
                      <Avatar className="h-10 w-10 border-2 border-orange-100">
                        <AvatarImage src={user?.photoURL ?? ""} alt={user?.email || "User"} />
                        <AvatarFallback className="bg-gradient-to-r from-orange-500 to-pink-500 text-white">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                          variant="destructive"
                          size="icon"
                          className="bg-orange-500 hover:bg-orange-600 h-8 w-8 rounded-full"
                          onClick={() => {
                            const logoutBtn = document.querySelector('button[type="button"]') as HTMLButtonElement
                            if (logoutBtn) logoutBtn.click()
                          }}
                      >
                        <LogOut size={14} />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-medium">{user?.email}</p>
                    <p className="text-xs text-gray-500">Click to logout</p>
                  </TooltipContent>
                </Tooltip>
            )}
          </div>
        </div>
      </TooltipProvider>
  )
}