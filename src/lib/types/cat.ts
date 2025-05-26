export interface CatProfile {
    id: string
    name: string
    description: string
    mainImage: string
    images: string[]
    videos: string[]
    color: string
    gender: string
    yearOfBirth: number
    age?: number
    isVaccinated: boolean
    isMicrochipped: boolean
    isCastrated: boolean
    breed: string
    category: string
    motherId?: string | null
    fatherId?: string | null
    availability: string
    createdAt: any // Using any to accommodate different timestamp formats
    updatedAt: any // Using any to accommodate different timestamp formats
    isDeleted: boolean
    deletedAt?: any
    deletedBy?: string | null
    views?: number
    lastViewed?: any
}

export interface PopularCat {
    id: string
    name: string
    breed: string
    views: number
    imageUrl?: string
}
