"use client"

import type React from "react"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { LockIcon } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import type { MediaItem } from "@/lib/firebase/storageService"

interface BulkLockMediaDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (reason: string) => void
    itemCount: number
    items: MediaItem[]
}

export function BulkLockMediaDialog({ isOpen, onClose, onConfirm, itemCount, items }: BulkLockMediaDialogProps) {
    const [reason, setReason] = useState("Important system media")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onConfirm(reason)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-amber-500 mb-2">
                            <LockIcon className="h-5 w-5" />
                            <DialogTitle>Lock {itemCount} Media Items</DialogTitle>
                        </div>
                        <DialogDescription>
                            Locking these {itemCount} items will protect them from being deleted. Please provide a reason for locking
                            these media items.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason for locking</Label>
                            <Textarea
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g., Important cat profile images, Site assets, etc."
                                className="w-full"
                                required
                            />
                        </div>

                        {itemCount > 0 && (
                            <div className="mt-4 max-h-32 overflow-y-auto">
                                <Label className="text-xs text-muted-foreground">Selected items:</Label>
                                <ul className="mt-1 text-xs text-muted-foreground space-y-1">
                                    {items.slice(0, 5).map((item) => (
                                        <li key={item.id} className="truncate">
                                            {item.name}
                                        </li>
                                    ))}
                                    {itemCount > 5 && <li>...and {itemCount - 5} more items</li>}
                                </ul>
                            </div>
                        )}

                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-800 text-sm">
                            <p>
                                <strong>Tip:</strong> Locked media cannot be deleted until unlocked. This helps prevent accidental
                                deletion of important files.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1">
                            <LockIcon className="h-4 w-4" />
                            Lock {itemCount} Items
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
