import type { Timestamp, FieldValue } from "firebase/firestore"

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
    age?: number // Add this line
    isVaccinated: boolean
    isMicrochipped: boolean
    isCastrated: boolean
    breed: string
    category: string
    motherId?: string | null
    fatherId?: string | null
    availability: string
    createdAt: Timestamp | FieldValue
    updatedAt: Timestamp | FieldValue
    isDeleted: boolean
    deletedAt?: Timestamp | FieldValue
    deletedBy?: string | null
    views?: number
    lastViewed?: Timestamp | FieldValue
}

export interface PopularCat {
    id: string
    name: string
    breed: string
    views: number
    imageUrl?: string
}
