export declare enum SortBy {
    DISTANCE = "distance",
    RATING = "rating",
    PRICE = "price",
    REVIEWS = "reviews",
    NEWEST = "newest"
}
export declare enum SortOrder {
    ASC = "asc",
    DESC = "desc"
}
export declare class SearchProvidersDto {
    query?: string;
    categoryId?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    minRating?: number;
    minPrice?: number;
    maxPrice?: number;
    serviceIds?: string[];
    sortBy?: SortBy;
    sortOrder?: SortOrder;
    limit?: number;
    offset?: number;
    availableDate?: string;
    availableTime?: string;
    isHomeService?: boolean;
    verifiedOnly?: boolean;
}
export declare class GetProviderDetailsDto {
    providerId: string;
    latitude?: number;
    longitude?: number;
}
