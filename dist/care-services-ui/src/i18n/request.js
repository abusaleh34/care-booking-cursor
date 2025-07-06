"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("next-intl/server");
const i18n_config_1 = require("../config/i18n.config");
exports.default = (0, server_1.getRequestConfig)(async ({ requestLocale }) => {
    let locale = await requestLocale;
    if (!locale || !i18n_config_1.locales.includes(locale)) {
        locale = i18n_config_1.defaultLocale;
    }
    return {
        locale,
        messages: (await Promise.resolve(`${`../locales/${locale}/messages.json`}`).then(s => require(s))).default,
    };
});
//# sourceMappingURL=request.js.map