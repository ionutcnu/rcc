export interface MediaItem {
  id: string
  name: string
  url: string
  type: "image" | "video"
  path?: string
  size?: number
  width?: number
  height?: number
  createdAt?: Date
  createdBy?: string
  updatedAt?: Date
  updatedBy?: string
  deleted?: boolean
  deletedAt?: Date
  deletedBy?: string
  locked?: boolean
  lockedReason?: string
  lockedAt?: Date
  lockedBy?: string
  folder?: string
  contentType?: string
}
