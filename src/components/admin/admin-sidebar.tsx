"use client"

import { Cat, ImageIcon, BarChart3, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

type TabType = "profiles" | "media" | "analytics" | "settings"

interface AdminSidebarProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

export function AdminSidebar({ activeTab, setActiveTab }: AdminSidebarProps) {
  const navItems = [
    {
      id: "profiles" as TabType,
      label: "Cat Profiles",
      icon: Cat,
    },
    {
      id: "media" as TabType,
      label: "Media Manager",
      icon: ImageIcon,
    },
    {
      id: "analytics" as TabType,
      label: "Analytics",
      icon: BarChart3,
    },
    {
      id: "settings" as TabType,
      label: "Settings",
      icon: Settings,
    },
  ]

  return (
    <div className="w-64 border-r bg-muted/40 h-screen">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <h1 className="font-semibold text-lg">Admin Dashboard</h1>
      </div>
      <nav className="flex flex-col gap-2 p-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
              activeTab === item.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
