"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const middleware_1 = require("next-intl/middleware");
const i18n_config_1 = require("./config/i18n.config");
exports.default = (0, middleware_1.default)({
    locales: i18n_config_1.locales,
    defaultLocale: i18n_config_1.defaultLocale,
    localePrefix: "as-needed",
});
exports.config = {
    matcher: [
        "/((?!api|_next|_vercel|.*\\..*).*)",
        "/([\\w-]+)?/users/(.+)",
    ],
};
//# sourceMappingURL=middleware.js.map