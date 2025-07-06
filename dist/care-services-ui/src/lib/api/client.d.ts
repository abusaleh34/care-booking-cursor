import { AxiosInstance } from "axios";
declare const apiClient: AxiosInstance;
export declare const api: {
    auth: {
        login: (data: {
            email: string;
            password: string;
        }) => Promise<import("axios").AxiosResponse<any, any>>;
        register: (data: {
            email: string;
            password: string;
            firstName: string;
            lastName: string;
            phone: string;
            role: string;
        }) => Promise<import("axios").AxiosResponse<any, any>>;
        logout: () => Promise<import("axios").AxiosResponse<any, any>>;
        refresh: (refreshToken: string) => Promise<import("axios").AxiosResponse<any, any>>;
    };
    customer: {
        getCategories: () => Promise<import("axios").AxiosResponse<any, any>>;
        searchProviders: (params: {
            query?: string;
            categoryId?: string;
            latitude?: number;
            longitude?: number;
            radius?: number;
            minRating?: number;
            minPrice?: number;
            maxPrice?: number;
            isHomeService?: boolean;
            verifiedOnly?: boolean;
            sortBy?: string;
            sortOrder?: string;
            limit?: number;
            offset?: number;
        }) => Promise<import("axios").AxiosResponse<any, any>>;
        getProviderDetails: (providerId: string) => Promise<import("axios").AxiosResponse<any, any>>;
        getAvailability: (params: {
            providerId: string;
            serviceId: string;
            date: string;
        }) => Promise<import("axios").AxiosResponse<any, any>>;
        createBooking: (data: {
            providerId: string;
            serviceId: string;
            bookingDate: string;
            startTime: string;
            notes?: string;
        }) => Promise<import("axios").AxiosResponse<any, any>>;
        getBookings: () => Promise<import("axios").AxiosResponse<any, any>>;
        getBookingDetails: (bookingId: string) => Promise<import("axios").AxiosResponse<any, any>>;
        rescheduleBooking: (bookingId: string, data: {
            newDate: string;
            newTime: string;
            reason?: string;
        }) => Promise<import("axios").AxiosResponse<any, any>>;
        cancelBooking: (bookingId: string, data: {
            reason?: string;
        }) => Promise<import("axios").AxiosResponse<any, any>>;
        getProfile: () => Promise<import("axios").AxiosResponse<any, any>>;
        getRecommendations: (params?: {
            latitude?: number;
            longitude?: number;
            limit?: number;
        }) => Promise<import("axios").AxiosResponse<any, any>>;
        getSuggestions: (query: string) => Promise<import("axios").AxiosResponse<any, any>>;
    };
    provider: {
        getDashboard: () => Promise<import("axios").AxiosResponse<any, any>>;
        getAnalytics: (params?: {
            period?: string;
            startDate?: string;
            endDate?: string;
        }) => Promise<import("axios").AxiosResponse<any, any>>;
        getEarnings: (params?: {
            period?: string;
            startDate?: string;
            endDate?: string;
        }) => Promise<import("axios").AxiosResponse<any, any>>;
        getProfile: () => Promise<import("axios").AxiosResponse<any, any>>;
        updateProfile: (data: any) => Promise<import("axios").AxiosResponse<any, any>>;
        getServices: () => Promise<import("axios").AxiosResponse<any, any>>;
        createService: (data: {
            name: string;
            description: string;
            categoryId: string;
            price: number;
            durationMinutes: number;
            isHomeService?: boolean;
        }) => Promise<import("axios").AxiosResponse<any, any>>;
        updateService: (serviceId: string, data: any) => Promise<import("axios").AxiosResponse<any, any>>;
        deleteService: (serviceId: string) => Promise<import("axios").AxiosResponse<any, any>>;
        getServicePerformance: () => Promise<import("axios").AxiosResponse<any, any>>;
        getAvailability: () => Promise<import("axios").AxiosResponse<any, any>>;
        setAvailability: (data: any) => Promise<import("axios").AxiosResponse<any, any>>;
        getBlockedTimes: (params?: {
            startDate?: string;
            endDate?: string;
        }) => Promise<import("axios").AxiosResponse<any, any>>;
        blockTime: (data: {
            date: string;
            startTime: string;
            endTime: string;
            reason?: string;
        }) => Promise<import("axios").AxiosResponse<any, any>>;
        unblockTime: (blockedTimeId: string) => Promise<import("axios").AxiosResponse<any, any>>;
        getBookings: (params?: {
            status?: string;
            startDate?: string;
            endDate?: string;
            page?: number;
            limit?: number;
        }) => Promise<import("axios").AxiosResponse<any, any>>;
        getTodayBookings: () => Promise<import("axios").AxiosResponse<any, any>>;
        getUpcomingBookings: (days?: number) => Promise<import("axios").AxiosResponse<any, any>>;
        getBookingDetails: (bookingId: string) => Promise<import("axios").AxiosResponse<any, any>>;
        handleBookingAction: (bookingId: string, action: {
            action: "accept" | "decline" | "complete";
            reason?: string;
        }) => Promise<import("axios").AxiosResponse<any, any>>;
        startService: (bookingId: string) => Promise<import("axios").AxiosResponse<any, any>>;
        requestReschedule: (data: {
            bookingId: string;
            newDate: string;
            newTime: string;
            reason?: string;
        }) => Promise<import("axios").AxiosResponse<any, any>>;
        getCalendar: (params: {
            startDate: string;
            endDate: string;
        }) => Promise<import("axios").AxiosResponse<any, any>>;
    };
    admin: {
        getUsers: (params?: {
            role?: string;
            status?: string;
            search?: string;
            page?: number;
            limit?: number;
        }) => Promise<import("axios").AxiosResponse<any, any>>;
    };
};
export default apiClient;
