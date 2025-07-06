"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthProvider = AuthProvider;
exports.useAuth = useAuth;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const react_query_1 = require("@tanstack/react-query");
const client_1 = require("../api/client");
const auth_utils_1 = require("./auth-utils");
const AuthContext = (0, react_1.createContext)(undefined);
function AuthProvider({ children }) {
    const [user, setUser] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const router = (0, navigation_1.useRouter)();
    (0, react_1.useEffect)(() => {
        const loadUser = () => {
            const savedUser = (0, auth_utils_1.getUser)();
            if (savedUser && (0, auth_utils_1.isAuthenticated)()) {
                setUser(savedUser);
            }
            setIsLoading(false);
        };
        loadUser();
    }, []);
    const loginMutation = (0, react_query_1.useMutation)({
        mutationFn: (data) => client_1.api.auth.login(data),
        onSuccess: (response) => {
            const authData = response.data;
            (0, auth_utils_1.saveAuth)(authData);
            setUser(authData.user);
            if (authData.user.roles.includes("admin")) {
                router.push("/admin");
            }
            else if (authData.user.roles.includes("service_provider")) {
                router.push("/provider/dashboard");
            }
            else {
                router.push("/customer/dashboard");
            }
        },
    });
    const registerMutation = (0, react_query_1.useMutation)({
        mutationFn: (data) => client_1.api.auth.register(data),
        onSuccess: (response) => {
            const authData = response.data;
            (0, auth_utils_1.saveAuth)(authData);
            setUser(authData.user);
            if (authData.user.roles.includes("service_provider")) {
                router.push("/provider/onboarding");
            }
            else {
                router.push("/customer/dashboard");
            }
        },
    });
    const login = (0, react_1.useCallback)(async (email, password) => {
        await loginMutation.mutateAsync({ email, password });
    }, [loginMutation]);
    const register = (0, react_1.useCallback)(async (data) => {
        await registerMutation.mutateAsync(data);
    }, [registerMutation]);
    const logout = (0, react_1.useCallback)(() => {
        (0, auth_utils_1.clearAuth)();
        setUser(null);
        router.push("/");
    }, [router]);
    const refreshAuth = (0, react_1.useCallback)(() => {
        const savedUser = (0, auth_utils_1.getUser)();
        if (savedUser && (0, auth_utils_1.isAuthenticated)()) {
            setUser(savedUser);
        }
        else {
            setUser(null);
        }
    }, []);
    const value = {
        user,
        isAuthenticated: !!user && (0, auth_utils_1.isAuthenticated)(),
        isLoading,
        login,
        register,
        logout,
        refreshAuth,
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
function useAuth() {
    const context = (0, react_1.useContext)(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
//# sourceMappingURL=auth-context.js.map