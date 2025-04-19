"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface SimpleConfirmDialogProps {
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    onCancel: () => void
}

export function SimpleConfirmDialog({ isOpen, title, message, onConfirm, onCancel }: SimpleConfirmDialogProps) {
    // Handle dialog close event
    const handleOpenChange = (open: boolean) => {
        if (!open) onCancel()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="max-w-full overflow-hidden text-ellipsis">{message}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={onConfirm}>
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
