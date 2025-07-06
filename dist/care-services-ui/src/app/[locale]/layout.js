"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LocaleLayout;
exports.generateStaticParams = generateStaticParams;
const navigation_1 = require("next/navigation");
const next_intl_1 = require("next-intl");
const query_provider_1 = require("@/lib/providers/query-provider");
const auth_context_1 = require("@/lib/auth/auth-context");
const i18n_config_1 = require("@/config/i18n.config");
async function LocaleLayout({ children, params, }) {
    const { locale } = await params;
    if (!i18n_config_1.locales.includes(locale)) {
        (0, navigation_1.notFound)();
    }
    const messages = (0, next_intl_1.useMessages)();
    const dir = i18n_config_1.directions[locale];
    return (<html lang={locale} dir={dir}>
      <body className={`min-h-screen bg-background text-foreground ${dir === "rtl" ? "font-arabic" : ""}`}>
        <next_intl_1.NextIntlClientProvider locale={locale} messages={messages}>
          <query_provider_1.QueryProvider>
            <auth_context_1.AuthProvider>
              {children}
            </auth_context_1.AuthProvider>
          </query_provider_1.QueryProvider>
        </next_intl_1.NextIntlClientProvider>
      </body>
    </html>);
}
function generateStaticParams() {
    return i18n_config_1.locales.map((locale) => ({ locale }));
}
//# sourceMappingURL=layout.js.map