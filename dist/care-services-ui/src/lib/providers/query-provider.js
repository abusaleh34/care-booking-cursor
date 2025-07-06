"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryProvider = QueryProvider;
const react_query_1 = require("@tanstack/react-query");
const react_query_devtools_1 = require("@tanstack/react-query-devtools");
const react_1 = require("react");
function QueryProvider({ children }) {
    const [queryClient] = (0, react_1.useState)(() => new react_query_1.QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
                gcTime: 10 * 60 * 1000,
                retry: 1,
                refetchOnWindowFocus: false,
            },
        },
    }));
    return (<react_query_1.QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && <react_query_devtools_1.ReactQueryDevtools />}
    </react_query_1.QueryClientProvider>);
}
//# sourceMappingURL=query-provider.js.map