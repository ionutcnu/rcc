export interface MediaItem {
  id: string
  name: string
  url: string
  type: "image" | "video"
  path?: string
  size?: string | number // Accept both string and number
  width?: number
  height?: number
  createdAt?: Date | string // Accept both Date and string
  createdBy?: string
  updatedAt?: Date | string // Accept both Date and string
  updatedBy?: string
  deleted?: boolean
  deletedAt?: Date | string // Accept both Date and string
  deletedBy?: string
  locked?: boolean
  lockedReason?: string
  lockedAt?: Date | string // Accept both Date and string
  lockedBy?: string
  folder?: string
  contentType?: string
  catName?: string // Added missing property
}
