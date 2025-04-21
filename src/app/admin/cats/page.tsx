"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ActiveCatsTab from "@/components/admin/cats/tabs/ActiveCatsTab"
import TrashCatsTab from "@/components/admin/cats/tabs/TrashCatsTab"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function AdminCatsPage() {
    const [activeTab, setActiveTab] = useState<"active" | "trash">("active")

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Cat Profiles</h1>
                <Button asChild>
                    <Link href="/admin/cats/add">
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Cat
                    </Link>
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "active" | "trash")} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="active" className="flex items-center">
                        Active Cats
                    </TabsTrigger>
                    <TabsTrigger value="trash" className="flex items-center">
                        Trash
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                    <ActiveCatsTab />
                </TabsContent>

                <TabsContent value="trash">
                    <TrashCatsTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}
