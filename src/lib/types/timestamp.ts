/**
 * A type-safe alternative to Firebase Timestamp
 */
export interface TimestampLike {
  seconds: number
  nanoseconds?: number
}

/**
 * Converts a TimestampLike object to milliseconds
 */
export function timestampToMillis(timestamp: TimestampLike): number {
  return timestamp.seconds * 1000 + (timestamp.nanoseconds ? timestamp.nanoseconds / 1000000 : 0)
}

/**
 * Safely gets a timestamp value from various possible formats
 */
export function getTimestampValue(value: any): number {
  if (!value) return 0

  // If it's a TimestampLike object with seconds
  if (typeof value === "object" && value !== null && "seconds" in value) {
    return timestampToMillis(value as TimestampLike)
  }

  // If it's a Date object
  if (value instanceof Date) {
    return value.getTime()
  }

  // If it's a string or number, try to convert to Date
  if (typeof value === "string" || typeof value === "number") {
    return new Date(value).getTime()
  }

  return 0
}
