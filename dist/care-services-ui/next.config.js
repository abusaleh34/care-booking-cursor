"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_1 = require("next-intl/plugin");
const withNextIntl = (0, plugin_1.default)();
const nextConfig = {
    images: {
        domains: ["localhost", "api.placeholder.com"],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: "2mb",
        },
    },
};
exports.default = withNextIntl(nextConfig);
//# sourceMappingURL=next.config.js.map