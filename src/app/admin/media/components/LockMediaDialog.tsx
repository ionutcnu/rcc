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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LockIcon } from "lucide-react"

interface LockMediaDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (reason: string) => void
    mediaName: string
}

export function LockMediaDialog({ isOpen, onClose, onConfirm, mediaName }: LockMediaDialogProps) {
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
                            <DialogTitle>Lock Media</DialogTitle>
                        </div>
                        <DialogDescription>
                            Locking "{mediaName}" will protect it from being deleted. Please provide a reason for locking this media.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason for locking</Label>
                            <Input
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g., OpenGraph image, Site logo, etc."
                                className="w-full"
                                required
                            />
                        </div>
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
                            Lock Media
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
