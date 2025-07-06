"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const navigation_1 = require("next/navigation");
const server_1 = require("next-intl/server");
const i18n_config_1 = require("./config/i18n.config");
exports.default = (0, server_1.getRequestConfig)(async ({ requestLocale }) => {
    const locale = await requestLocale;
    if (!locale || !i18n_config_1.locales.includes(locale)) {
        (0, navigation_1.notFound)();
    }
    return {
        messages: (await Promise.resolve(`${`./locales/${locale}/messages.json`}`).then(s => require(s))).default,
    };
});
//# sourceMappingURL=i18n.js.map