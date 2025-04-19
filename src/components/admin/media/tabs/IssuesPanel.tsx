"use client"

import { Film } from "lucide-react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArchiveIcon } from "lucide-react"
import type { MediaItem } from "@/lib/firebase/storageService"

interface IssuesPanelProps {
    issues: MediaItem[]
    onClose: () => void
    onMoveToTrash: (item: MediaItem) => void
}

export default function IssuesPanel({ issues, onClose, onMoveToTrash }: IssuesPanelProps) {
    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="flex items-center text-amber-600">Media Issues Found ({issues.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="mb-4">The following media items may have issues. Please review before taking action.</p>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {issues.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden mr-3">
                                    {item.type === "image" ? (
                                        <img
                                            src="/placeholder.svg?height=48&width=48"
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Film className="h-6 w-6 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-sm truncate max-w-[200px]">{item.name}</p>
                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{item.path || item.url}</p>
                                </div>
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => onMoveToTrash(item)}>
                                <ArchiveIcon className="h-4 w-4 mr-1" />
                                Move to Trash
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="mt-4 flex justify-end">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
