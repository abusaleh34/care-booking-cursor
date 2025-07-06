"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HomePage;
const next_intl_1 = require("next-intl");
const hero_section_enhanced_1 = require("@/components/landing/hero-section-enhanced");
const categories_section_enhanced_1 = require("@/components/landing/categories-section-enhanced");
const featured_providers_1 = require("@/components/landing/featured-providers");
const features_section_1 = require("@/components/landing/features-section");
const how_it_works_section_1 = require("@/components/landing/how-it-works-section");
const testimonials_1 = require("@/components/landing/testimonials");
const navbar_enhanced_1 = require("@/components/layout/navbar-enhanced");
const footer_1 = require("@/components/layout/footer");
function HomePage() {
    const t = (0, next_intl_1.useTranslations)();
    return (<>
      <navbar_enhanced_1.NavbarEnhanced />
      <main className="min-h-screen">
        <hero_section_enhanced_1.HeroSectionEnhanced />
        <categories_section_enhanced_1.CategoriesSectionEnhanced />
        <featured_providers_1.FeaturedProviders />
        <features_section_1.FeaturesSection />
        <how_it_works_section_1.HowItWorksSection />
        <testimonials_1.Testimonials />
      </main>
      <footer_1.Footer />
    </>);
}
//# sourceMappingURL=page.js.map