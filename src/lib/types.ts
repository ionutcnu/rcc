// Define log entry structure
export interface LogEntry {
    id: string
    timestamp: Date
    level: "info" | "warn" | "error" | "debug"
    message: string
    details?: any
    userId?: string
    userEmail?: string
}
