export interface CatProfile {
    id?: string;
    name: string;
    description: string;
    mainImage: string;
    images: string[];
    videos: string[];
    color: string;
    gender: string;
    yearOfBirth: number;
    isVaccinated: boolean;
    isMicrochipped: boolean;
    isCastrated: boolean;
    breed: string;
    category: string;
    motherId: string | null;
    fatherId: string | null;
    availability: string;

    createdAt?: any;
    updatedAt?: any;
    isDeleted?: boolean;
}
