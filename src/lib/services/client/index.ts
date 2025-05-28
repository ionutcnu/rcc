// Export all client services for easy importing
export { clientAuthService } from './authService'
export { clientMediaService } from './mediaService'

// Re-export existing API clients
export { fetchAllCats, fetchCatById, fetchCatByName, fetchTrashCats, createCat, updateCat, deleteCat, permanentlyDeleteCat, restoreCat, uploadCatImage, uploadCatVideo, bulkDeleteCats, bulkRestoreCats, incrementCatViewCount } from '../../api/catClient'
export { fetchCats, fetchMediaStats, fetchRecentActivity } from '../../api/dashboardClient'
export { fetchActiveMedia, fetchLockedMedia, fetchTrashMedia, moveMediaToTrash, restoreMediaFromTrash, deleteMediaPermanently, downloadMedia, lockMediaItem, unlockMediaItem, useMedia } from '../../api/mediaClient'

// Export the existing authService for backward compatibility
export { authService } from '../authService'

// Export types
export type { LoginCredentials, RegisterData, User, AuthResponse } from './authService'
export type { MediaFile, UploadProgress, UploadResponse, MediaStats } from './mediaService'