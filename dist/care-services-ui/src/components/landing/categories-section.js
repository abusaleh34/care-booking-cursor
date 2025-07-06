"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesSection = CategoriesSection;
const react_query_1 = require("@tanstack/react-query");
const navigation_1 = require("next/navigation");
const next_intl_1 = require("next-intl");
const framer_motion_1 = require("framer-motion");
const client_1 = require("@/lib/api/client");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
const categoryIcons = {
    "Beauty & Wellness": "💆‍♀️",
    "Hair & Styling": "💇‍♀️",
    "Fitness & Training": "🏋️‍♀️",
    "Health & Medical": "⚕️",
    "Home Services": "🏠",
    "Personal Care": "🧘‍♀️",
};
function CategoriesSection() {
    const t = (0, next_intl_1.useTranslations)("services");
    const locale = (0, next_intl_1.useLocale)();
    const router = (0, navigation_1.useRouter)();
    const { data, isLoading } = (0, react_query_1.useQuery)({
        queryKey: ["categories"],
        queryFn: async () => {
            const response = await client_1.api.customer.getCategories();
            return response.data.data;
        },
    });
    const handleCategoryClick = (categoryId) => {
        router.push(`/${locale}/services?categoryId=${categoryId}`);
    };
    if (isLoading) {
        return (<section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("categories")}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (<div key={i} className="skeleton h-32 rounded-lg"/>))}
          </div>
        </div>
      </section>);
    }
    return (<section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("categories")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("popularServices")}
          </p>
        </framer_motion_1.motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {data?.map((category, index) => (<framer_motion_1.motion.div key={category.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.1 }}>
              <card_1.Card className="group cursor-pointer h-full card-hover glass" onClick={() => handleCategoryClick(category.id)}>
                <div className="p-6 text-center">
                  <div className="text-4xl mb-3">
                    {categoryIcons[category.name] || "✨"}
                  </div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {category.serviceCount} {t("services").toLowerCase()}
                  </p>
                  <div className="flex justify-center">
                    <lucide_react_1.ArrowRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all"/>
                  </div>
                </div>
              </card_1.Card>
            </framer_motion_1.motion.div>))}
        </div>

        <framer_motion_1.motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.4 }} className="text-center mt-12">
          <button_1.Button size="lg" onClick={() => router.push(`/${locale}/services`)} className="group">
            {t("allCategories")}
            <lucide_react_1.ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform"/>
          </button_1.Button>
        </framer_motion_1.motion.div>
      </div>
    </section>);
}
//# sourceMappingURL=categories-section.js.map