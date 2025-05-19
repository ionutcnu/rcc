export type LogLevel = "info" | "warn" | "error"

export interface LogEntry {
  id: string
  message: string
  level: LogLevel
  timestamp: Date
  details?: any
  userId?: string
  userEmail?: string
  catId?: string
  catName?: string
  actionType?: string
  archivedAt?: Date
}

export interface LogFilterOptions {
  pageSize?: number
  cursor?: string | null
  filter?: string
  startDate?: string | null
  endDate?: string | null
  actionType?: string | null
  search?: string | null
  skipCache?: boolean
  tab?: string // Added tab parameter to detect which tab is active
}
