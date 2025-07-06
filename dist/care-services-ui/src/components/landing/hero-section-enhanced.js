"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeroSectionEnhanced = HeroSectionEnhanced;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const next_intl_1 = require("next-intl");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const framer_motion_1 = require("framer-motion");
const stats = [
    { icon: lucide_react_1.Users, value: "10,000+", label: "Happy Customers" },
    { icon: lucide_react_1.Award, value: "500+", label: "Verified Providers" },
    { icon: lucide_react_1.Star, value: "4.8", label: "Average Rating" },
    { icon: lucide_react_1.TrendingUp, value: "50K+", label: "Services Completed" },
];
function HeroSectionEnhanced() {
    const t = (0, next_intl_1.useTranslations)("landing.hero");
    const tCommon = (0, next_intl_1.useTranslations)("common");
    const locale = (0, next_intl_1.useLocale)();
    const router = (0, navigation_1.useRouter)();
    const [searchQuery, setSearchQuery] = (0, react_1.useState)("");
    const [location, setLocation] = (0, react_1.useState)("");
    const [suggestions, setSuggestions] = (0, react_1.useState)([]);
    const [showSuggestions, setShowSuggestions] = (0, react_1.useState)(false);
    const popularServices = [
        { name: "Massage Therapy", icon: "💆‍♀️", color: "from-purple-400 to-pink-400" },
        { name: "Hair Styling", icon: "💇‍♀️", color: "from-blue-400 to-cyan-400" },
        { name: "Nail Care", icon: "💅", color: "from-pink-400 to-rose-400" },
        { name: "Personal Training", icon: "🏋️‍♀️", color: "from-orange-400 to-red-400" },
        { name: "Yoga Classes", icon: "🧘‍♀️", color: "from-green-400 to-teal-400" },
    ];
    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchQuery)
            params.append("q", searchQuery);
        if (location)
            params.append("location", location);
        router.push(`/${locale}/services?${params.toString()}`);
    };
    (0, react_1.useEffect)(() => {
        if (searchQuery.length > 2) {
            const filtered = popularServices
                .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(s => s.name);
            setSuggestions(filtered);
            setShowSuggestions(true);
        }
        else {
            setShowSuggestions(false);
        }
    }, [searchQuery]);
    return (<section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      
      <div className="absolute inset-0 overflow-hidden">
        <framer_motion_1.motion.div animate={{
            scale: [1, 1.2, 1],
            x: [0, 100, 0],
            y: [0, -50, 0],
        }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full opacity-20 blur-3xl"/>
        <framer_motion_1.motion.div animate={{
            scale: [1, 1.1, 1],
            x: [0, -100, 0],
            y: [0, 50, 0],
        }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute -bottom-20 -left-20 w-96 h-96 bg-gradient-to-br from-blue-300 to-cyan-300 rounded-full opacity-20 blur-3xl"/>
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          <framer_motion_1.motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="text-center lg:text-left">
            <framer_motion_1.motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              <lucide_react_1.Star className="w-4 h-4"/>
              <span>Trusted by thousands of customers</span>
            </framer_motion_1.motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {t("title")}
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-xl mx-auto lg:mx-0">
              {t("subtitle")}
            </p>

            
            <framer_motion_1.motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} onSubmit={handleSearch} className="relative">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-2 max-w-2xl mx-auto lg:mx-0">
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="relative flex-1">
                    <input_1.Input type="text" placeholder={t("searchPlaceholder")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} className="h-14 px-6 text-base border-0 bg-gray-50 dark:bg-gray-700" icon={<lucide_react_1.Search className="h-5 w-5 text-gray-400"/>}/>
                    
                    
                    {showSuggestions && suggestions.length > 0 && (<framer_motion_1.motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50">
                        {suggestions.map((suggestion, index) => (<button key={index} type="button" onClick={() => {
                    setSearchQuery(suggestion);
                    setShowSuggestions(false);
                }} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            {suggestion}
                          </button>))}
                      </framer_motion_1.motion.div>)}
                  </div>
                  
                  <div className="flex-1 md:flex-initial md:w-64">
                    <input_1.Input type="text" placeholder={t("locationPlaceholder")} value={location} onChange={(e) => setLocation(e.target.value)} className="h-14 px-6 text-base border-0 bg-gray-50 dark:bg-gray-700" icon={<lucide_react_1.MapPin className="h-5 w-5 text-gray-400"/>}/>
                  </div>
                  
                  <button_1.Button type="submit" size="lg" className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all">
                    {tCommon("search")}
                  </button_1.Button>
                </div>
              </div>
            </framer_motion_1.motion.form>

            
            <framer_motion_1.motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start">
              <span className="text-sm text-gray-500 dark:text-gray-400">Popular:</span>
              {popularServices.map((service, index) => (<framer_motion_1.motion.button key={service.name} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 + index * 0.1 }} whileHover={{ scale: 1.05 }} onClick={() => {
                setSearchQuery(service.name);
                handleSearch(new Event("submit"));
            }} className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${service.color} text-white text-sm font-medium shadow-md hover:shadow-lg transition-all`}>
                  <span>{service.icon}</span>
                  <span>{service.name}</span>
                </framer_motion_1.motion.button>))}
            </framer_motion_1.motion.div>
          </framer_motion_1.motion.div>

          
          <framer_motion_1.motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative hidden lg:block">
            <div className="relative w-full h-[600px]">
              
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-3xl opacity-10"/>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 p-8">
                  {[1, 2, 3, 4].map((i) => (<framer_motion_1.motion.div key={i} animate={{ y: [0, -10, 0] }} transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }} className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${i % 2 === 0 ? "from-blue-400 to-purple-400" : "from-pink-400 to-orange-400"} opacity-20`}/>))}
                </div>
              </div>
              
              
              <framer_motion_1.motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-10 right-10 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white">
                    💆‍♀️
                  </div>
                  <div>
                    <p className="font-semibold">Spa Service</p>
                    <p className="text-sm text-gray-500">Starting from $50</p>
                  </div>
                </div>
              </framer_motion_1.motion.div>

              <framer_motion_1.motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} className="absolute bottom-20 left-10 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white">
                    💇‍♀️
                  </div>
                  <div>
                    <p className="font-semibold">Hair Styling</p>
                    <div className="flex items-center gap-1 text-sm">
                      <lucide_react_1.Star className="w-4 h-4 text-yellow-500 fill-current"/>
                      <span>4.9 (120 reviews)</span>
                    </div>
                  </div>
                </div>
              </framer_motion_1.motion.div>
            </div>
          </framer_motion_1.motion.div>
        </div>

        
        <framer_motion_1.motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }} className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (<framer_motion_1.motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 + index * 0.1 }} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full mb-3">
                  <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400"/>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{stat.label}</p>
              </framer_motion_1.motion.div>);
        })}
        </framer_motion_1.motion.div>
      </div>
    </section>);
}
//# sourceMappingURL=hero-section-enhanced.js.map