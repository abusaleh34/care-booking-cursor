"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.isProvider = exports.isCustomer = exports.hasRole = exports.isAuthenticated = exports.clearAuth = exports.saveAuth = exports.removeUser = exports.getUser = exports.setUser = exports.removeRefreshToken = exports.getRefreshToken = exports.setRefreshToken = exports.removeAuthToken = exports.getAuthToken = exports.setAuthToken = void 0;
const TOKEN_KEY = "care_services_token";
const REFRESH_TOKEN_KEY = "care_services_refresh_token";
const USER_KEY = "care_services_user";
const setAuthToken = (token) => {
    if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, token);
    }
};
exports.setAuthToken = setAuthToken;
const getAuthToken = () => {
    if (typeof window !== "undefined") {
        return localStorage.getItem(TOKEN_KEY);
    }
    return null;
};
exports.getAuthToken = getAuthToken;
const removeAuthToken = () => {
    if (typeof window !== "undefined") {
        localStorage.removeItem(TOKEN_KEY);
    }
};
exports.removeAuthToken = removeAuthToken;
const setRefreshToken = (token) => {
    if (typeof window !== "undefined") {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
};
exports.setRefreshToken = setRefreshToken;
const getRefreshToken = () => {
    if (typeof window !== "undefined") {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
};
exports.getRefreshToken = getRefreshToken;
const removeRefreshToken = () => {
    if (typeof window !== "undefined") {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
};
exports.removeRefreshToken = removeRefreshToken;
const setUser = (user) => {
    if (typeof window !== "undefined") {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
};
exports.setUser = setUser;
const getUser = () => {
    if (typeof window !== "undefined") {
        const userStr = localStorage.getItem(USER_KEY);
        if (userStr) {
            try {
                return JSON.parse(userStr);
            }
            catch (e) {
                console.error("Error parsing user data:", e);
            }
        }
    }
    return null;
};
exports.getUser = getUser;
const removeUser = () => {
    if (typeof window !== "undefined") {
        localStorage.removeItem(USER_KEY);
    }
};
exports.removeUser = removeUser;
const saveAuth = (authData) => {
    (0, exports.setAuthToken)(authData.accessToken);
    (0, exports.setRefreshToken)(authData.refreshToken);
    (0, exports.setUser)(authData.user);
};
exports.saveAuth = saveAuth;
const clearAuth = () => {
    (0, exports.removeAuthToken)();
    (0, exports.removeRefreshToken)();
    (0, exports.removeUser)();
};
exports.clearAuth = clearAuth;
const isAuthenticated = () => {
    return !!(0, exports.getAuthToken)();
};
exports.isAuthenticated = isAuthenticated;
const hasRole = (role) => {
    const user = (0, exports.getUser)();
    return user?.roles?.includes(role) || false;
};
exports.hasRole = hasRole;
const isCustomer = () => (0, exports.hasRole)("customer");
exports.isCustomer = isCustomer;
const isProvider = () => (0, exports.hasRole)("service_provider");
exports.isProvider = isProvider;
const isAdmin = () => (0, exports.hasRole)("admin");
exports.isAdmin = isAdmin;
//# sourceMappingURL=auth-utils.js.map