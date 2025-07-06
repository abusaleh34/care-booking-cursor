"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RootPage;
const navigation_1 = require("next/navigation");
const i18n_config_1 = require("@/config/i18n.config");
function RootPage() {
    (0, navigation_1.redirect)(`/${i18n_config_1.defaultLocale}`);
}
//# sourceMappingURL=page.js.map