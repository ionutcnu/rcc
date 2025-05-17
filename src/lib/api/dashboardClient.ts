/**
 * Dashboard API client
 * Uses API routes instead of direct Firebase access
 */

// Get all cats from the API
export async function fetchCats() {
  try {
    const response = await fetch("/api/cats")
    if (!response.ok) throw new Error("Failed to fetch cats")
    return await response.json()
  } catch (error) {
    console.error("Error fetching cats:", error)
    return []
  }
}

// Get media stats from the API
export async function fetchMediaStats() {
  try {
    const response = await fetch("/api/media/stats")
    if (!response.ok) throw new Error("Failed to fetch media stats")
    return await response.json()
  } catch (error) {
    console.error("Error fetching media stats:", error)
    return { totalFiles: 0, totalViews: 0, deletedFiles: 0 }
  }
}

// Get recent activity from the API
export async function fetchRecentActivity(limit = 4) {
  try {
    const response = await fetch(`/api/activity/recent?limit=${limit}`)
    if (!response.ok) throw new Error("Failed to fetch recent activity")
    return await response.json()
  } catch (error) {
    console.error("Error fetching recent activity:", error)
    return []
  }
}
