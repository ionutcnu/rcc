"use client"

import { useState } from "react"
import { CatProfiles } from "@/components/admin/cat-profiles"
import MediaManager from "@/components/admin/media-manager"
import { Settings } from "./settings"

type TabType = "profiles" | "media" | "settings"

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<TabType>("profiles")

    return (
        <div className="container mx-auto py-6 px-4">
            {activeTab === "profiles" && <CatProfiles />}
            {activeTab === "media" && <MediaManager />}
            {activeTab === "settings" && <Settings />}
        </div>
    )
}
