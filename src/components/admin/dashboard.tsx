"use client"

import { useState } from "react"
import { AdminSidebar } from "./admin-sidebar"
import { CatProfiles } from "./cat-profiles"
import MediaManager from "./media-manager"
import { Analytics } from "./analytics"
import { Settings } from "./settings"

type TabType = "profiles" | "media" | "analytics" | "settings"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("profiles")

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 px-4">
          {activeTab === "profiles" && <CatProfiles />}
          {activeTab === "media" && <MediaManager />}
          {activeTab === "analytics" && <Analytics />}
          {activeTab === "settings" && <Settings />}
        </div>
      </div>
    </div>
  )
}
