// Define log entry structure
export interface LogEntry {
    id: string
    timestamp: Date
    level: "info" | "warn" | "error" | "debug"
    message: string
    details?: any
    userId?: string
    userEmail?: string
    catId?: string // Cat identifier for cat-related logs
    catName?: string // Cat name for easier identification
    actionType?: "add" | "update" | "delete" | "upload" | "archive" | "restore" | "system" // Log action type
    archivedAt?: Date // Timestamp when the log was archived
}

export interface DateRange {
    startDate: Date | null
    endDate: Date | null
}
