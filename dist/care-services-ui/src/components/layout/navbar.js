"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Navbar = Navbar;
const react_1 = require("react");
const link_1 = require("next/link");
const navigation_1 = require("next/navigation");
const next_intl_1 = require("next-intl");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const utils_1 = require("@/lib/utils");
const auth_context_1 = require("@/lib/auth/auth-context");
const i18n_config_1 = require("@/config/i18n.config");
function Navbar() {
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const t = (0, next_intl_1.useTranslations)();
    const locale = (0, next_intl_1.useLocale)();
    const pathname = (0, navigation_1.usePathname)();
    const router = (0, navigation_1.useRouter)();
    const { user, isAuthenticated, logout } = (0, auth_context_1.useAuth)();
    const switchLocale = (newLocale) => {
        const segments = pathname.split("/");
        segments[1] = newLocale;
        router.push(segments.join("/"));
    };
    const navLinks = [
        { href: `/${locale}`, label: t("navigation.home") },
        { href: `/${locale}/services`, label: t("navigation.services") },
        { href: `/${locale}/providers`, label: t("navigation.providers") },
    ];
    const userLinks = isAuthenticated
        ? [
            {
                href: user?.roles.includes("service_provider")
                    ? `/${locale}/provider/dashboard`
                    : user?.roles.includes("admin")
                        ? `/${locale}/admin`
                        : `/${locale}/customer/dashboard`,
                label: t("navigation.dashboard"),
            },
            { href: `/${locale}/bookings`, label: t("navigation.bookings") },
            { href: `/${locale}/profile`, label: t("navigation.profile") },
        ]
        : [];
    return (<nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          
          <link_1.default href={`/${locale}`} className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="text-xl font-bold gradient-text">
              {t("common.appName")}
            </span>
          </link_1.default>

          
          <div className="hidden md:flex md:items-center md:space-x-6 rtl:space-x-reverse">
            {navLinks.map((link) => (<link_1.default key={link.href} href={link.href} className={(0, utils_1.cn)("text-sm font-medium transition-colors hover:text-primary", pathname === link.href
                ? "text-primary"
                : "text-muted-foreground")}>
                {link.label}
              </link_1.default>))}
            {userLinks.map((link) => (<link_1.default key={link.href} href={link.href} className={(0, utils_1.cn)("text-sm font-medium transition-colors hover:text-primary", pathname.startsWith(link.href)
                ? "text-primary"
                : "text-muted-foreground")}>
                {link.label}
              </link_1.default>))}
          </div>

          
          <div className="hidden md:flex md:items-center md:space-x-4 rtl:space-x-reverse">
            
            <div className="relative group">
              <button_1.Button variant="ghost" size="sm" className="flex items-center space-x-1 rtl:space-x-reverse">
                <lucide_react_1.Globe className="h-4 w-4"/>
                <span>{i18n_config_1.localeNames[locale]}</span>
              </button_1.Button>
              <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-48 rounded-md bg-background border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {i18n_config_1.locales.map((loc) => (<button key={loc} onClick={() => switchLocale(loc)} className={(0, utils_1.cn)("block w-full px-4 py-2 text-sm text-left rtl:text-right hover:bg-accent", locale === loc && "bg-accent")}>
                    {i18n_config_1.localeNames[loc]}
                  </button>))}
              </div>
            </div>

            
            {isAuthenticated ? (<div className="flex items-center space-x-2 rtl:space-x-reverse">
                <button_1.Button variant="ghost" size="sm" className="flex items-center space-x-1 rtl:space-x-reverse">
                  <lucide_react_1.User className="h-4 w-4"/>
                  <span>{user?.firstName || user?.email}</span>
                </button_1.Button>
                <button_1.Button variant="ghost" size="sm" onClick={logout} className="text-destructive hover:text-destructive">
                  <lucide_react_1.LogOut className="h-4 w-4"/>
                </button_1.Button>
              </div>) : (<>
                <button_1.Button variant="ghost" size="sm" onClick={() => router.push(`/${locale}/login`)}>
                  {t("common.login")}
                </button_1.Button>
                <button_1.Button size="sm" onClick={() => router.push(`/${locale}/register`)}>
                  {t("common.register")}
                </button_1.Button>
              </>)}
          </div>

          
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 rounded-md hover:bg-accent">
            {isOpen ? (<lucide_react_1.X className="h-5 w-5"/>) : (<lucide_react_1.Menu className="h-5 w-5"/>)}
          </button>
        </div>

        
        {isOpen && (<div className="md:hidden py-4 space-y-2">
            {[...navLinks, ...userLinks].map((link) => (<link_1.default key={link.href} href={link.href} onClick={() => setIsOpen(false)} className={(0, utils_1.cn)("block px-4 py-2 text-sm font-medium rounded-md transition-colors", pathname === link.href
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:bg-accent")}>
                {link.label}
              </link_1.default>))}
            
            <div className="border-t pt-4 mt-4">
              <div className="px-4 py-2">
                <p className="text-xs text-muted-foreground mb-2">
                  {t("common.language")}
                </p>
                <div className="flex space-x-2 rtl:space-x-reverse">
                  {i18n_config_1.locales.map((loc) => (<button_1.Button key={loc} variant={locale === loc ? "default" : "outline"} size="sm" onClick={() => switchLocale(loc)}>
                      {i18n_config_1.localeNames[loc]}
                    </button_1.Button>))}
                </div>
              </div>
              
              {isAuthenticated ? (<div className="px-4 py-2 space-y-2">
                  <p className="text-sm font-medium">
                    {user?.firstName || user?.email}
                  </p>
                  <button_1.Button variant="destructive" size="sm" onClick={logout} className="w-full">
                    <lucide_react_1.LogOut className="h-4 w-4 mr-2"/>
                    {t("common.logout")}
                  </button_1.Button>
                </div>) : (<div className="px-4 py-2 space-y-2">
                  <button_1.Button variant="outline" size="sm" onClick={() => router.push(`/${locale}/login`)} className="w-full">
                    {t("common.login")}
                  </button_1.Button>
                  <button_1.Button size="sm" onClick={() => router.push(`/${locale}/register`)} className="w-full">
                    {t("common.register")}
                  </button_1.Button>
                </div>)}
            </div>
          </div>)}
      </div>
    </nav>);
}
//# sourceMappingURL=navbar.js.map