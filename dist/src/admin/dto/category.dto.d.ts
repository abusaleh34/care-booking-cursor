export declare class CreateCategoryDto {
    name: string;
    description?: string;
    iconUrl?: string;
    isActive?: boolean;
}
export declare class UpdateCategoryDto {
    name?: string;
    description?: string;
    iconUrl?: string;
    isActive?: boolean;
    sortOrder?: number;
}
