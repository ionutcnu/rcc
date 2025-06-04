interface MediaFile {
  id: string
  filename: string
  url: string
  type: 'image' | 'video'
  size: number
  uploadedAt: string
  catId?: string
  isDeleted?: boolean
  deletedAt?: string
}

interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

interface UploadResponse {
  success: boolean
  data?: MediaFile
  error?: string
  message?: string
}

interface MediaStats {
  totalFiles: number
  totalSize: number
  imageCount: number
  videoCount: number
  deletedCount: number
}

import { deduplicateRequest } from "../../api/requestDeduplicator"

export class ClientMediaService {
  private baseUrl = '/api/media'

  async uploadImage(file: File, catId?: string, onProgress?: (progress: UploadProgress) => void): Promise<UploadResponse> {
    try {
      const formData = new FormData()
      formData.append('image', file)
      if (catId) {
        formData.append('catId', catId)
      }

      const xhr = new XMLHttpRequest()
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100)
            }
            onProgress(progress)
          }
        })

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              resolve(response)
            } catch (error) {
              reject(new Error('Invalid response format'))
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText)
              reject(new Error(errorResponse.error || 'Upload failed'))
            } catch (error) {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          }
        }

        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.ontimeout = () => reject(new Error('Upload timeout'))

        xhr.open('POST', `${this.baseUrl}/upload/image`)
        xhr.timeout = 300000 // 5 minutes
        xhr.send(formData)
      })
    } catch (error) {
      console.error('Image upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image upload failed'
      }
    }
  }

  async uploadVideo(file: File, catId?: string, onProgress?: (progress: UploadProgress) => void): Promise<UploadResponse> {
    try {
      const formData = new FormData()
      formData.append('video', file)
      if (catId) {
        formData.append('catId', catId)
      }

      const xhr = new XMLHttpRequest()
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100)
            }
            onProgress(progress)
          }
        })

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              resolve(response)
            } catch (error) {
              reject(new Error('Invalid response format'))
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText)
              reject(new Error(errorResponse.error || 'Upload failed'))
            } catch (error) {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          }
        }

        xhr.onerror = () => reject(new Error('Network error during upload'))
        xhr.ontimeout = () => reject(new Error('Upload timeout'))

        xhr.open('POST', `${this.baseUrl}/upload/video`)
        xhr.timeout = 600000 // 10 minutes for videos
        xhr.send(formData)
      })
    } catch (error) {
      console.error('Video upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Video upload failed'
      }
    }
  }

  async getAllMedia(): Promise<MediaFile[]> {
    return deduplicateRequest('getAllMedia', async () => {
      try {
        const response = await fetch(`${this.baseUrl}`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store'
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch media: ${response.status}`)
        }

        const data = await response.json()
        return data.files || data || []
      } catch (error) {
        console.error('Error fetching media:', error)
        return []
      }
    })
  }

  async getMediaById(id: string): Promise<MediaFile | null> {
    return deduplicateRequest(`getMediaById_${id}`, async () => {
      try {
        const response = await fetch(`${this.baseUrl}/${id}`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store'
        })

        if (!response.ok) {
          if (response.status === 404) {
            return null
          }
          throw new Error(`Failed to fetch media: ${response.status}`)
        }

        return await response.json()
      } catch (error) {
        console.error(`Error fetching media ${id}:`, error)
        throw error
      }
    })
  }

  async deleteMedia(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Delete failed: ${response.status}`)
      }

      return true
    } catch (error) {
      console.error(`Error deleting media ${id}:`, error)
      throw error
    }
  }

  async restoreMedia(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/restore`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Restore failed: ${response.status}`)
      }

      return true
    } catch (error) {
      console.error(`Error restoring media ${id}:`, error)
      throw error
    }
  }

  async permanentlyDeleteMedia(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/permanent`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Permanent delete failed: ${response.status}`)
      }

      return true
    } catch (error) {
      console.error(`Error permanently deleting media ${id}:`, error)
      throw error
    }
  }

  async getMediaStats(): Promise<MediaStats> {
    return deduplicateRequest('getMediaStats', async () => {
      try {
        const response = await fetch(`${this.baseUrl}/stats`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store'
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch media stats: ${response.status}`)
        }

        const data = await response.json()
        return {
          totalFiles: data.totalFiles || 0,
          totalSize: data.totalSize || 0,
          imageCount: data.imageCount || 0,
          videoCount: data.videoCount || 0,
          deletedCount: data.deletedCount || 0
        }
      } catch (error) {
        console.error('Error fetching media stats:', error)
        return {
          totalFiles: 0,
          totalSize: 0,
          imageCount: 0,
          videoCount: 0,
          deletedCount: 0
        }
      }
    })
  }

  async downloadMedia(id: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/download`, {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`)
      }

      return await response.blob()
    } catch (error) {
      console.error(`Error downloading media ${id}:`, error)
      throw error
    }
  }

  async bulkDelete(ids: string[]): Promise<{ success: boolean; id: string; error?: string }[]> {
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        await this.deleteMedia(id)
        return { success: true, id }
      })
    )

    return results.map((result, index) => ({
      success: result.status === 'fulfilled',
      id: ids[index],
      error: result.status === 'rejected' ? result.reason.message : undefined
    }))
  }

  async bulkRestore(ids: string[]): Promise<{ success: boolean; id: string; error?: string }[]> {
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        await this.restoreMedia(id)
        return { success: true, id }
      })
    )

    return results.map((result, index) => ({
      success: result.status === 'fulfilled',
      id: ids[index],
      error: result.status === 'rejected' ? result.reason.message : undefined
    }))
  }

  validateFileSize(file: File, maxSizeMB: number = 50): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    return file.size <= maxSizeBytes
  }

  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type)
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  generateThumbnail(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('File is not an image'))
        return
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        const MAX_SIZE = 200
        let { width, height } = img

        if (width > height) {
          if (width > MAX_SIZE) {
            height = (height * MAX_SIZE) / width
            width = MAX_SIZE
          }
        } else {
          if (height > MAX_SIZE) {
            width = (width * MAX_SIZE) / height
            height = MAX_SIZE
          }
        }

        canvas.width = width
        canvas.height = height
        ctx?.drawImage(img, 0, 0, width, height)
        
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8)
        resolve(thumbnail)
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }
}

// Export singleton instance
export const clientMediaService = new ClientMediaService()

// Export types
export type { MediaFile, UploadProgress, UploadResponse, MediaStats }