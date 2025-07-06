"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeaturedProviders = FeaturedProviders;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const navigation_1 = require("next/navigation");
const next_intl_1 = require("next-intl");
const framer_motion_1 = require("framer-motion");
const client_1 = require("@/lib/api/client");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
function ProviderCard({ provider, index }) {
    const router = (0, navigation_1.useRouter)();
    const locale = (0, next_intl_1.useLocale)();
    return (<framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} whileHover={{ y: -5 }} className="w-full">
      <card_1.Card className="group h-full bg-white dark:bg-gray-800 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
        
        <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-600 overflow-hidden">
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-4xl">👤</span>
            </div>
          </div>
          
          
          {provider.isVerified && (<div className="absolute top-4 right-4 bg-white dark:bg-gray-900 rounded-full p-2 shadow-lg">
              <lucide_react_1.Shield className="w-5 h-5 text-blue-600 dark:text-blue-400"/>
            </div>)}
          
          
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-900 rounded-full px-3 py-1 shadow-lg flex items-center gap-1">
            <lucide_react_1.Star className="w-4 h-4 text-yellow-500 fill-current"/>
            <span className="font-semibold text-sm">{provider.averageRating || "4.8"}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({provider.totalReviews || 0})
            </span>
          </div>
        </div>

        
        <div className="p-6">
          <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {provider.businessName}
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {provider.businessDescription}
          </p>
          
          
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <lucide_react_1.MapPin className="w-4 h-4"/>
            <span className="truncate">{provider.businessAddress}</span>
          </div>
          
          
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Popular Services:</p>
            <div className="flex flex-wrap gap-2">
              {provider.services?.slice(0, 3).map((service, idx) => (<span key={idx} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                  {service.name}
                </span>))}
              {provider.services?.length > 3 && (<span className="text-xs text-gray-500 dark:text-gray-400">
                  +{provider.services.length - 3} more
                </span>)}
            </div>
          </div>
          
          
          <div className="flex gap-2">
            <button_1.Button onClick={() => router.push(`/${locale}/providers/${provider.id}`)} className="flex-1" variant="outline">
              View Profile
            </button_1.Button>
            <button_1.Button onClick={() => router.push(`/${locale}/booking?providerId=${provider.id}`)} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              Book Now
            </button_1.Button>
          </div>
        </div>
      </card_1.Card>
    </framer_motion_1.motion.div>);
}
function FeaturedProviders() {
    const t = (0, next_intl_1.useTranslations)();
    const [currentSlide, setCurrentSlide] = (0, react_1.useState)(0);
    const { data, isLoading } = (0, react_query_1.useQuery)({
        queryKey: ["featured-providers"],
        queryFn: async () => {
            const response = await client_1.api.customer.searchProviders({
                verifiedOnly: true,
                sortBy: "rating",
                sortOrder: "desc",
                limit: 8,
            });
            return response.data.data.providers;
        },
    });
    const providersPerSlide = 4;
    const totalSlides = Math.ceil((data?.length || 0) / providersPerSlide);
    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
    };
    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    };
    return (<section className="py-20 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <lucide_react_1.Award className="w-4 h-4"/>
            <span>Top Rated Professionals</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Featured Service Providers
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover our highly-rated professionals trusted by thousands of customers
          </p>
        </framer_motion_1.motion.div>

        
        <div className="relative">
          {isLoading ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (<div key={i} className="animate-pulse">
                  <div className="bg-gray-200 dark:bg-gray-700 h-96 rounded-2xl"/>
                </div>))}
            </div>) : (<>
              <div className="overflow-hidden">
                <framer_motion_1.motion.div animate={{ x: `-${currentSlide * 100}%` }} transition={{ duration: 0.5, ease: "easeInOut" }} className="flex">
                  {data?.map((provider, index) => (<div key={provider.id} className="w-full md:w-1/2 lg:w-1/4 px-3 flex-shrink-0">
                      <ProviderCard provider={provider} index={index}/>
                    </div>))}
                </framer_motion_1.motion.div>
              </div>

              
              {totalSlides > 1 && (<>
                  <button onClick={prevSlide} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:shadow-xl transition-all">
                    <lucide_react_1.ChevronLeft className="w-6 h-6"/>
                  </button>
                  <button onClick={nextSlide} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:shadow-xl transition-all">
                    <lucide_react_1.ChevronRight className="w-6 h-6"/>
                  </button>
                </>)}
            </>)}
        </div>

        
        {totalSlides > 1 && (<div className="flex justify-center gap-2 mt-8">
            {[...Array(totalSlides)].map((_, index) => (<button key={index} onClick={() => setCurrentSlide(index)} className={`w-2 h-2 rounded-full transition-all ${currentSlide === index
                    ? "w-8 bg-blue-600 dark:bg-blue-400"
                    : "bg-gray-300 dark:bg-gray-600"}`}/>))}
          </div>)}
      </div>
    </section>);
}
//# sourceMappingURL=featured-providers.js.map