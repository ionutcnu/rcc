"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { UnlockIcon, AlertTriangleIcon } from "lucide-react"

interface UnlockConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    mediaName: string
}

export function UnlockConfirmDialog({ isOpen, onClose, onConfirm, mediaName }: UnlockConfirmDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-2 text-amber-500 mb-2">
                        <AlertTriangleIcon className="h-5 w-5" />
                        <AlertDialogTitle>Unlock Protected Media</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="space-y-3">
                        <p>
                            Are you sure you want to unlock <span className="font-medium text-foreground">"{mediaName}"</span>?
                        </p>
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 text-sm">
                            <p>
                                <strong>Warning:</strong> Unlocking this media will remove its protection and allow it to be deleted.
                                This could affect your website if this media is used in important places.
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1"
                    >
                        <UnlockIcon className="h-4 w-4" />
                        Unlock Media
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
