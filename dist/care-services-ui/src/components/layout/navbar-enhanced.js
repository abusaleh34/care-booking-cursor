"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavbarEnhanced = NavbarEnhanced;
const react_1 = require("react");
const link_1 = require("next/link");
const navigation_1 = require("next/navigation");
const next_intl_1 = require("next-intl");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const utils_1 = require("@/lib/utils");
const auth_context_1 = require("@/lib/auth/auth-context");
const i18n_config_1 = require("@/config/i18n.config");
const framer_motion_1 = require("framer-motion");
function NavbarEnhanced() {
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const [scrolled, setScrolled] = (0, react_1.useState)(false);
    const [isDark, setIsDark] = (0, react_1.useState)(false);
    const t = (0, next_intl_1.useTranslations)();
    const locale = (0, next_intl_1.useLocale)();
    const pathname = (0, navigation_1.usePathname)();
    const router = (0, navigation_1.useRouter)();
    const { user, isAuthenticated, logout } = (0, auth_context_1.useAuth)();
    (0, react_1.useEffect)(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);
    (0, react_1.useEffect)(() => {
        const darkMode = document.documentElement.classList.contains("dark");
        setIsDark(darkMode);
    }, []);
    const toggleDarkMode = () => {
        setIsDark(!isDark);
        document.documentElement.classList.toggle("dark");
    };
    const switchLocale = (newLocale) => {
        const segments = pathname.split("/");
        segments[1] = newLocale;
        router.push(segments.join("/"));
    };
    const navLinks = [
        { href: `/${locale}`, label: t("navigation.home"), icon: null },
        { href: `/${locale}/services`, label: t("navigation.services"), icon: null },
        { href: `/${locale}/providers`, label: t("navigation.providers"), icon: null },
    ];
    return (<framer_motion_1.motion.nav initial={{ y: -100 }} animate={{ y: 0 }} className={(0, utils_1.cn)("fixed top-0 z-50 w-full transition-all duration-300", scrolled
            ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg"
            : "bg-transparent")}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 md:h-20 items-center justify-between">
          
          <link_1.default href={`/${locale}`} className="flex items-center space-x-2 rtl:space-x-reverse group">
            <framer_motion_1.motion.div whileHover={{ scale: 1.05 }} className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                C
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"/>
            </framer_motion_1.motion.div>
            <span className={(0, utils_1.cn)("text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent", !scrolled && "dark:from-white dark:to-gray-100")}>
              {t("common.appName")}
            </span>
          </link_1.default>

          
          <div className="hidden lg:flex lg:items-center lg:space-x-8 rtl:space-x-reverse">
            {navLinks.map((link) => (<link_1.default key={link.href} href={link.href} className={(0, utils_1.cn)("relative text-sm font-medium transition-colors group", pathname === link.href
                ? scrolled
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-white"
                : scrolled
                    ? "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    : "text-white/80 hover:text-white")}>
                {link.label}
                {pathname === link.href && (<framer_motion_1.motion.div layoutId="navbar-indicator" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"/>)}
              </link_1.default>))}
          </div>

          
          <div className="hidden lg:flex lg:items-center lg:space-x-4 rtl:space-x-reverse">
            
            <button_1.Button variant="ghost" size="icon" className={(0, utils_1.cn)("rounded-full", !scrolled && "text-white hover:text-white hover:bg-white/20")} onClick={() => router.push(`/${locale}/search`)}>
              <lucide_react_1.Search className="h-5 w-5"/>
            </button_1.Button>

            
            <button_1.Button variant="ghost" size="icon" onClick={toggleDarkMode} className={(0, utils_1.cn)("rounded-full", !scrolled && "text-white hover:text-white hover:bg-white/20")}>
              <framer_motion_1.AnimatePresence mode="wait">
                {isDark ? (<framer_motion_1.motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                    <lucide_react_1.Sun className="h-5 w-5"/>
                  </framer_motion_1.motion.div>) : (<framer_motion_1.motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                    <lucide_react_1.Moon className="h-5 w-5"/>
                  </framer_motion_1.motion.div>)}
              </framer_motion_1.AnimatePresence>
            </button_1.Button>

            
            <div className="relative group">
              <button_1.Button variant="ghost" size="sm" className={(0, utils_1.cn)("flex items-center space-x-1 rtl:space-x-reverse rounded-full", !scrolled && "text-white hover:text-white hover:bg-white/20")}>
                <lucide_react_1.Globe className="h-4 w-4"/>
                <span className="text-sm">{i18n_config_1.localeNames[locale]}</span>
              </button_1.Button>
              <framer_motion_1.AnimatePresence>
                <framer_motion_1.motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-48 rounded-xl bg-white dark:bg-gray-800 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  {i18n_config_1.locales.map((loc) => (<button key={loc} onClick={() => switchLocale(loc)} className={(0, utils_1.cn)("block w-full px-4 py-3 text-sm text-left rtl:text-right hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors", locale === loc && "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400", loc === i18n_config_1.locales[0] && "rounded-t-xl", loc === i18n_config_1.locales[i18n_config_1.locales.length - 1] && "rounded-b-xl")}>
                      {i18n_config_1.localeNames[loc]}
                    </button>))}
                </framer_motion_1.motion.div>
              </framer_motion_1.AnimatePresence>
            </div>

            
            {isAuthenticated ? (<div className="flex items-center space-x-3 rtl:space-x-reverse">
                
                <button_1.Button variant="ghost" size="icon" className={(0, utils_1.cn)("rounded-full relative", !scrolled && "text-white hover:text-white hover:bg-white/20")}>
                  <lucide_react_1.Bell className="h-5 w-5"/>
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    3
                  </span>
                </button_1.Button>

                
                <button_1.Button variant="ghost" size="icon" className={(0, utils_1.cn)("rounded-full", !scrolled && "text-white hover:text-white hover:bg-white/20")}>
                  <lucide_react_1.Heart className="h-5 w-5"/>
                </button_1.Button>

                
                <button_1.Button variant="ghost" size="icon" className={(0, utils_1.cn)("rounded-full", !scrolled && "text-white hover:text-white hover:bg-white/20")} onClick={() => router.push(`/${locale}/bookings`)}>
                  <lucide_react_1.Calendar className="h-5 w-5"/>
                </button_1.Button>

                
                <div className="relative group">
                  <button_1.Button variant="ghost" size="sm" className={(0, utils_1.cn)("flex items-center space-x-2 rtl:space-x-reverse rounded-full px-3", !scrolled && "text-white hover:text-white hover:bg-white/20")}>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user?.firstName?.[0] || user?.email?.[0] || "U"}
                    </div>
                    <span className="text-sm font-medium">{user?.firstName || "User"}</span>
                  </button_1.Button>
                  
                  <framer_motion_1.AnimatePresence>
                    <framer_motion_1.motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-56 rounded-xl bg-white dark:bg-gray-800 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <div className="p-4 border-b dark:border-gray-700">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                      </div>
                      <div className="p-2">
                        <link_1.default href={user?.roles.includes("service_provider")
                ? `/${locale}/provider/dashboard`
                : `/${locale}/customer/dashboard`} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                          {t("navigation.dashboard")}
                        </link_1.default>
                        <link_1.default href={`/${locale}/profile`} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                          {t("navigation.profile")}
                        </link_1.default>
                        <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          {t("common.logout")}
                        </button>
                      </div>
                    </framer_motion_1.motion.div>
                  </framer_motion_1.AnimatePresence>
                </div>
              </div>) : (<div className="flex items-center space-x-3 rtl:space-x-reverse">
                <button_1.Button variant="ghost" onClick={() => router.push(`/${locale}/login`)} className={(0, utils_1.cn)("rounded-full", !scrolled && "text-white hover:text-white hover:bg-white/20")}>
                  {t("common.login")}
                </button_1.Button>
                <button_1.Button onClick={() => router.push(`/${locale}/register`)} className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all">
                  {t("common.register")}
                </button_1.Button>
              </div>)}
          </div>

          
          <button onClick={() => setIsOpen(!isOpen)} className={(0, utils_1.cn)("lg:hidden p-2 rounded-lg transition-colors", scrolled
            ? "hover:bg-gray-100 dark:hover:bg-gray-800"
            : "text-white hover:bg-white/20")}>
            {isOpen ? <lucide_react_1.X className="h-6 w-6"/> : <lucide_react_1.Menu className="h-6 w-6"/>}
          </button>
        </div>

        
        <framer_motion_1.AnimatePresence>
          {isOpen && (<framer_motion_1.motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="lg:hidden bg-white dark:bg-gray-900 rounded-b-2xl shadow-xl">
              <div className="px-4 py-6 space-y-4">
                {navLinks.map((link) => (<link_1.default key={link.href} href={link.href} onClick={() => setIsOpen(false)} className={(0, utils_1.cn)("block px-4 py-3 text-base font-medium rounded-lg transition-colors", pathname === link.href
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700")}>
                    {link.label}
                  </link_1.default>))}
                
                
                {!isAuthenticated && (<div className="pt-4 space-y-3 border-t dark:border-gray-700">
                    <button_1.Button variant="outline" onClick={() => router.push(`/${locale}/login`)} className="w-full rounded-full">
                      {t("common.login")}
                    </button_1.Button>
                    <button_1.Button onClick={() => router.push(`/${locale}/register`)} className="w-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                      {t("common.register")}
                    </button_1.Button>
                  </div>)}
              </div>
            </framer_motion_1.motion.div>)}
        </framer_motion_1.AnimatePresence>
      </div>
    </framer_motion_1.motion.nav>);
}
//# sourceMappingURL=navbar-enhanced.js.map