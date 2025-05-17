export interface LogEntry {
  id: string
  message: string
  level: "info" | "warn" | "error"
  timestamp: Date
  details?: any
  userId?: string
  userEmail?: string
  catId?: string
  catName?: string
  actionType?: string
  archivedAt?: Date
}
