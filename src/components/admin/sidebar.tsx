"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Cat, ImageIcon, BarChart3, Settings, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  const navItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: Home,
    },
    {
      title: "Cats",
      href: "/admin/cats",
      icon: Cat,
    },
    {
      title: "Media Manager",
      href: "/admin/media",
      icon: ImageIcon,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ]

  return (
      <div
          className={cn(
              "h-screen bg-white border-r transition-all duration-300 ease-in-out flex flex-col",
              isCollapsed ? "w-16" : "w-64",
          )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          {!isCollapsed && <h1 className="font-bold text-xl">Cat Admin</h1>}
          <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="ml-auto"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu size={20} />
          </Button>
        </div>

        <nav className="p-2 flex-1">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href))

              return (
                  <li key={item.href}>
                    <Link
                        href={item.href}
                        className={cn(
                            "flex items-center p-3 rounded-md transition-colors",
                            isActive ? "bg-orange-500 text-white" : "text-gray-700 hover:bg-gray-100",
                            isCollapsed ? "justify-center" : "space-x-3",
                        )}
                    >
                      <item.icon size={20} />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  </li>
              )
            })}
          </ul>
        </nav>

        <div className="p-4 border-t text-sm text-gray-500">
          {!isCollapsed && (
              <div>
                <p>Cat Showcase Admin</p>
                <p>v1.0</p>
              </div>
          )}
        </div>
      </div>
  )
}
