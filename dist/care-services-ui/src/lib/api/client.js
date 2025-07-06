"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const axios_1 = require("axios");
const auth_utils_1 = require("../auth/auth-utils");
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
const apiClient = axios_1.default.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});
apiClient.interceptors.request.use(async (config) => {
    if (typeof window !== "undefined") {
        const token = (0, auth_utils_1.getAuthToken)();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
apiClient.interceptors.response.use((response) => response, async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        (0, auth_utils_1.removeAuthToken)();
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
    }
    if (error.response?.status === 500) {
        console.error("Server error:", error.response.data);
    }
    return Promise.reject(error);
});
exports.api = {
    auth: {
        login: (data) => apiClient.post("/auth/login", data),
        register: (data) => apiClient.post("/auth/register", data),
        logout: () => apiClient.post("/auth/logout"),
        refresh: (refreshToken) => apiClient.post("/auth/refresh", { refreshToken }),
    },
    customer: {
        getCategories: () => apiClient.get("/customer/categories"),
        searchProviders: (params) => apiClient.get("/customer/search", { params }),
        getProviderDetails: (providerId) => apiClient.get(`/customer/providers/${providerId}`),
        getAvailability: (params) => apiClient.get("/customer/availability", { params }),
        createBooking: (data) => apiClient.post("/customer/bookings", data),
        getBookings: () => apiClient.get("/customer/bookings"),
        getBookingDetails: (bookingId) => apiClient.get(`/customer/bookings/${bookingId}`),
        rescheduleBooking: (bookingId, data) => apiClient.put(`/customer/bookings/${bookingId}/reschedule`, data),
        cancelBooking: (bookingId, data) => apiClient.delete(`/customer/bookings/${bookingId}`, { data }),
        getProfile: () => apiClient.get("/customer/profile"),
        getRecommendations: (params) => apiClient.get("/customer/recommendations", { params }),
        getSuggestions: (query) => apiClient.get("/customer/suggestions", { params: { q: query } }),
    },
    provider: {
        getDashboard: () => apiClient.get("/provider/dashboard"),
        getAnalytics: (params) => apiClient.get("/provider/analytics", { params }),
        getEarnings: (params) => apiClient.get("/provider/earnings", { params }),
        getProfile: () => apiClient.get("/provider/profile"),
        updateProfile: (data) => apiClient.put("/provider/profile", data),
        getServices: () => apiClient.get("/provider/services"),
        createService: (data) => apiClient.post("/provider/services", data),
        updateService: (serviceId, data) => apiClient.put(`/provider/services/${serviceId}`, data),
        deleteService: (serviceId) => apiClient.delete(`/provider/services/${serviceId}`),
        getServicePerformance: () => apiClient.get("/provider/services/performance"),
        getAvailability: () => apiClient.get("/provider/availability"),
        setAvailability: (data) => apiClient.put("/provider/availability", data),
        getBlockedTimes: (params) => apiClient.get("/provider/blocked-times", { params }),
        blockTime: (data) => apiClient.post("/provider/blocked-times", data),
        unblockTime: (blockedTimeId) => apiClient.delete(`/provider/blocked-times/${blockedTimeId}`),
        getBookings: (params) => apiClient.get("/provider/bookings", { params }),
        getTodayBookings: () => apiClient.get("/provider/bookings/today"),
        getUpcomingBookings: (days) => apiClient.get("/provider/bookings/upcoming", { params: { days } }),
        getBookingDetails: (bookingId) => apiClient.get(`/provider/bookings/${bookingId}`),
        handleBookingAction: (bookingId, action) => apiClient.post(`/provider/bookings/${bookingId}/action`, action),
        startService: (bookingId) => apiClient.post(`/provider/bookings/${bookingId}/start`),
        requestReschedule: (data) => apiClient.post("/provider/bookings/reschedule", data),
        getCalendar: (params) => apiClient.get("/provider/calendar", { params }),
    },
    admin: {
        getUsers: (params) => apiClient.get("/admin/users", { params }),
    },
};
exports.default = apiClient;
//# sourceMappingURL=client.js.map