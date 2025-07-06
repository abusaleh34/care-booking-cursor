"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesSectionEnhanced = CategoriesSectionEnhanced;
const react_query_1 = require("@tanstack/react-query");
const navigation_1 = require("next/navigation");
const next_intl_1 = require("next-intl");
const framer_motion_1 = require("framer-motion");
const client_1 = require("@/lib/api/client");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
const categoryConfig = {
    "Beauty & Wellness": {
        icon: "💆‍♀️",
        gradient: "from-purple-500 to-pink-500",
        bgColor: "bg-purple-50 dark:bg-purple-900/20"
    },
    "Hair & Styling": {
        icon: "💇‍♀️",
        gradient: "from-blue-500 to-cyan-500",
        bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    "Fitness & Training": {
        icon: "🏋️‍♀️",
        gradient: "from-orange-500 to-red-500",
        bgColor: "bg-orange-50 dark:bg-orange-900/20"
    },
    "Health & Medical": {
        icon: "⚕️",
        gradient: "from-green-500 to-teal-500",
        bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    "Home Services": {
        icon: "🏠",
        gradient: "from-indigo-500 to-purple-500",
        bgColor: "bg-indigo-50 dark:bg-indigo-900/20"
    },
    "Personal Care": {
        icon: "🧘‍♀️",
        gradient: "from-pink-500 to-rose-500",
        bgColor: "bg-pink-50 dark:bg-pink-900/20"
    },
};
function CategorySkeleton() {
    return (<div className="animate-pulse">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl mx-auto mb-4"/>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4 mx-auto mb-2"/>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2 mx-auto"/>
      </div>
    </div>);
}
function CategoriesSectionEnhanced() {
    const t = (0, next_intl_1.useTranslations)("services");
    const locale = (0, next_intl_1.useLocale)();
    const router = (0, navigation_1.useRouter)();
    const { data, isLoading, error } = (0, react_query_1.useQuery)({
        queryKey: ["categories"],
        queryFn: async () => {
            const response = await client_1.api.customer.getCategories();
            return response.data.data;
        },
    });
    const handleCategoryClick = (categoryId) => {
        router.push(`/${locale}/services?categoryId=${categoryId}`);
    };
    return (<section className="py-20 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500 rounded-full blur-3xl"/>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"/>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <lucide_react_1.Sparkles className="w-4 h-4"/>
            <span>Explore Our Services</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {t("categories")}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose from our wide range of professional services delivered by verified experts
          </p>
        </framer_motion_1.motion.div>

        
        {isLoading ? (<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (<CategorySkeleton key={i}/>))}
          </div>) : error ? (<div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400">Failed to load categories. Please try again.</p>
            <button_1.Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
              Retry
            </button_1.Button>
          </div>) : (<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data?.map((category, index) => {
                const config = categoryConfig[category.name] || {
                    icon: "✨",
                    gradient: "from-gray-500 to-gray-600",
                    bgColor: "bg-gray-50 dark:bg-gray-900/20"
                };
                return (<framer_motion_1.motion.div key={category.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.1 }} whileHover={{ y: -5 }} onClick={() => handleCategoryClick(category.id)} className="cursor-pointer">
                  <card_1.Card className="group relative overflow-hidden h-full bg-white dark:bg-gray-800 border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                    
                    <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}/>
                    
                    <div className="relative p-6 text-center">
                      
                      <div className={`w-20 h-20 ${config.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <span className="text-4xl">{config.icon}</span>
                      </div>
                      
                      
                      <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                        {category.name}
                      </h3>
                      
                      
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <lucide_react_1.Users className="w-4 h-4"/>
                        <span>{category.serviceCount || 0} providers</span>
                      </div>
                      
                      
                      <div className="flex items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                        <div className="flex items-center gap-1">
                          <lucide_react_1.Star className="w-3 h-3 text-yellow-500 fill-current"/>
                          <span>4.8</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <lucide_react_1.TrendingUp className="w-3 h-3 text-green-500"/>
                          <span>Popular</span>
                        </div>
                      </div>
                      
                      
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <lucide_react_1.ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400"/>
                      </div>
                    </div>
                  </card_1.Card>
                </framer_motion_1.motion.div>);
            })}

            
            <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: data?.length ? data.length * 0.1 : 0 }} className="cursor-pointer">
              <card_1.Card className="group relative overflow-hidden h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="relative p-6 text-center h-full flex flex-col justify-center">
                  <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <lucide_react_1.Sparkles className="w-10 h-10 text-gray-400 dark:text-gray-500"/>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-600 dark:text-gray-400">
                    More Coming Soon
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Stay tuned for more services
                  </p>
                </div>
              </card_1.Card>
            </framer_motion_1.motion.div>
          </div>)}

        
        <framer_motion_1.motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.4 }} className="text-center mt-12">
          <button_1.Button size="lg" onClick={() => router.push(`/${locale}/services`)} className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <span>{t("allCategories")}</span>
            <lucide_react_1.ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform"/>
          </button_1.Button>
        </framer_motion_1.motion.div>
      </div>
    </section>);
}
//# sourceMappingURL=categories-section-enhanced.js.map