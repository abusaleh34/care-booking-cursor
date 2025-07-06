"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Footer = Footer;
const link_1 = require("next/link");
const next_intl_1 = require("next-intl");
const lucide_react_1 = require("lucide-react");
function Footer() {
    const t = (0, next_intl_1.useTranslations)();
    const locale = (0, next_intl_1.useLocale)();
    const footerLinks = {
        services: [
            { href: `/${locale}/services`, label: t("services.categories") },
            { href: `/${locale}/providers`, label: t("navigation.providers") },
            { href: `/${locale}/how-it-works`, label: t("landing.howItWorks.title") },
        ],
        company: [
            { href: `/${locale}/about`, label: t("navigation.about") },
            { href: `/${locale}/contact`, label: t("navigation.contact") },
            { href: `/${locale}/careers`, label: "Careers" },
        ],
        support: [
            { href: `/${locale}/help`, label: "Help Center" },
            { href: `/${locale}/terms`, label: t("auth.termsOfService") },
            { href: `/${locale}/privacy`, label: t("auth.privacyPolicy") },
        ],
    };
    const socialLinks = [
        { icon: lucide_react_1.Facebook, href: "#", label: "Facebook" },
        { icon: lucide_react_1.Twitter, href: "#", label: "Twitter" },
        { icon: lucide_react_1.Instagram, href: "#", label: "Instagram" },
        { icon: lucide_react_1.Youtube, href: "#", label: "Youtube" },
    ];
    return (<footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          <div className="lg:col-span-2">
            <link_1.default href={`/${locale}`} className="inline-block mb-4">
              <span className="text-2xl font-bold gradient-text">
                {t("common.appName")}
              </span>
            </link_1.default>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {t("landing.hero.subtitle")}
            </p>
            
            
            <div className="flex space-x-4 rtl:space-x-reverse">
              {socialLinks.map((social) => {
            const Icon = social.icon;
            return (<a key={social.label} href={social.href} aria-label={social.label} className="w-10 h-10 rounded-full bg-background border flex items-center justify-center hover:bg-accent transition-colors">
                    <Icon className="h-5 w-5"/>
                  </a>);
        })}
            </div>
          </div>

          
          <div>
            <h3 className="font-semibold mb-4">{t("navigation.services")}</h3>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (<li key={link.href}>
                  <link_1.default href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </link_1.default>
                </li>))}
            </ul>
          </div>

          
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (<li key={link.href}>
                  <link_1.default href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </link_1.default>
                </li>))}
            </ul>
          </div>

          
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (<li key={link.href}>
                  <link_1.default href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </link_1.default>
                </li>))}
            </ul>
          </div>
        </div>

        
        <div className="mt-8 pt-8 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <lucide_react_1.Mail className="h-4 w-4"/>
              <span>support@careservices.com</span>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <lucide_react_1.Phone className="h-4 w-4"/>
              <span>+966 50 123 4567</span>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <lucide_react_1.MapPin className="h-4 w-4"/>
              <span>Riyadh, Saudi Arabia</span>
            </div>
          </div>
        </div>

        
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {t("common.appName")}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>);
}
//# sourceMappingURL=footer.js.map