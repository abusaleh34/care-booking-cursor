"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ServicesPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const react_query_1 = require("@tanstack/react-query");
const next_intl_1 = require("next-intl");
const framer_motion_1 = require("framer-motion");
const client_1 = require("@/lib/api/client");
const navbar_enhanced_1 = require("@/components/layout/navbar-enhanced");
const footer_1 = require("@/components/layout/footer");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const badge_1 = require("@/components/ui/badge");
const slider_1 = require("@/components/ui/slider");
const lucide_react_1 = require("lucide-react");
const utils_1 = require("@/lib/utils");
const lodash_1 = require("lodash");
const serviceSuggestions = [
    { name: "Massage Therapy", icon: "💆‍♀️", category: "wellness" },
    { name: "Hair Styling", icon: "💇‍♀️", category: "beauty" },
    { name: "Nail Care", icon: "💅", category: "beauty" },
    { name: "Personal Training", icon: "🏋️‍♀️", category: "fitness" },
    { name: "Yoga Classes", icon: "🧘‍♀️", category: "wellness" },
    { name: "Facial Treatment", icon: "✨", category: "beauty" },
    { name: "Makeup Artist", icon: "💄", category: "beauty" },
    { name: "Nutrition Coaching", icon: "🥗", category: "health" },
];
const locationSuggestions = [
    "Downtown Dubai",
    "Dubai Marina",
    "Business Bay",
    "JBR",
    "DIFC",
    "Dubai Hills",
    "Arabian Ranches",
    "Dubai Sports City",
];
function ServicesPage() {
    const t = (0, next_intl_1.useTranslations)();
    const locale = (0, next_intl_1.useLocale)();
    const router = (0, navigation_1.useRouter)();
    const searchParams = (0, navigation_1.useSearchParams)();
    const searchInputRef = (0, react_1.useRef)(null);
    const locationInputRef = (0, react_1.useRef)(null);
    const [viewMode, setViewMode] = (0, react_1.useState)("grid");
    const [showFilters, setShowFilters] = (0, react_1.useState)(false);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)(searchParams.get("q") || "");
    const [locationQuery, setLocationQuery] = (0, react_1.useState)(searchParams.get("location") || "");
    const [showSearchSuggestions, setShowSearchSuggestions] = (0, react_1.useState)(false);
    const [showLocationSuggestions, setShowLocationSuggestions] = (0, react_1.useState)(false);
    const [searchSuggestionsList, setSearchSuggestionsList] = (0, react_1.useState)([]);
    const [locationSuggestionsList, setLocationSuggestionsList] = (0, react_1.useState)([]);
    const [priceRange, setPriceRange] = (0, react_1.useState)([0, 500]);
    const [selectedCategories, setSelectedCategories] = (0, react_1.useState)([]);
    const [filters, setFilters] = (0, react_1.useState)({
        query: searchParams.get("q") || "",
        location: searchParams.get("location") || "",
        categoryId: searchParams.get("categoryId") || "",
        minPrice: "",
        maxPrice: "",
        minRating: "",
        isHomeService: false,
        verifiedOnly: true,
        sortBy: "relevance",
        availability: "any",
    });
    const { data: categories } = (0, react_query_1.useQuery)({
        queryKey: ["categories"],
        queryFn: async () => {
            const response = await client_1.api.customer.getCategories();
            return response.data.data;
        },
    });
    const { data: providersData, isLoading, refetch } = (0, react_query_1.useQuery)({
        queryKey: ["providers", filters],
        queryFn: async () => {
            const params = {
                verifiedOnly: filters.verifiedOnly,
                sortBy: filters.sortBy,
                sortOrder: filters.sortBy === "price" ? "asc" : "desc",
            };
            if (filters.query)
                params.query = filters.query;
            if (filters.categoryId)
                params.categoryId = filters.categoryId;
            if (filters.minPrice)
                params.minPrice = Number(filters.minPrice);
            if (filters.maxPrice)
                params.maxPrice = Number(filters.maxPrice);
            if (filters.minRating)
                params.minRating = Number(filters.minRating);
            if (filters.isHomeService)
                params.isHomeService = true;
            const response = await client_1.api.customer.searchProviders(params);
            return response.data.data;
        },
    });
    const providers = providersData?.providers || [];
    const debouncedSearch = (0, react_1.useCallback)((0, lodash_1.debounce)((query) => {
        if (query.length > 1) {
            const filtered = serviceSuggestions.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
            setSearchSuggestionsList(filtered);
            setShowSearchSuggestions(true);
        }
        else {
            setShowSearchSuggestions(false);
        }
    }, 300), []);
    const debouncedLocationSearch = (0, react_1.useCallback)((0, lodash_1.debounce)((query) => {
        if (query.length > 1) {
            const filtered = locationSuggestions.filter(l => l.toLowerCase().includes(query.toLowerCase()));
            setLocationSuggestionsList(filtered);
            setShowLocationSuggestions(true);
        }
        else {
            setShowLocationSuggestions(false);
        }
    }, 300), []);
    (0, react_1.useEffect)(() => {
        debouncedSearch(searchQuery);
    }, [searchQuery, debouncedSearch]);
    (0, react_1.useEffect)(() => {
        debouncedLocationSearch(locationQuery);
    }, [locationQuery, debouncedLocationSearch]);
    (0, react_1.useEffect)(() => {
        setFilters(prev => ({
            ...prev,
            query: searchQuery,
            location: locationQuery,
            minPrice: priceRange[0].toString(),
            maxPrice: priceRange[1].toString(),
        }));
    }, [searchQuery, locationQuery, priceRange]);
    const quickFilters = [
        { label: "Top Rated", icon: lucide_react_1.Star, action: () => setFilters({ ...filters, minRating: "4.5" }) },
        { label: "Home Service", icon: lucide_react_1.Home, action: () => setFilters({ ...filters, isHomeService: true }) },
        { label: "Available Today", icon: lucide_react_1.Calendar, action: () => setFilters({ ...filters, availability: "today" }) },
        { label: "Budget Friendly", icon: lucide_react_1.DollarSign, action: () => setPriceRange([0, 100]) },
    ];
    return (<>
      <navbar_enhanced_1.NavbarEnhanced />
      <main className="min-h-screen pt-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        
        <div className="bg-white dark:bg-gray-800 shadow-lg sticky top-20 z-40 border-b border-gray-100 dark:border-gray-700">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col gap-4">
              
              <div className="flex flex-col lg:flex-row gap-4">
                
                <div className="flex-1 relative">
                  <div className="relative">
                    <input_1.Input ref={searchInputRef} type="text" placeholder="What service are you looking for?" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => searchQuery && setShowSearchSuggestions(true)} onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)} className="h-14 pl-12 pr-4 text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 transition-all"/>
                    <lucide_react_1.Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>
                  </div>
                  
                  
                  <framer_motion_1.AnimatePresence>
                    {showSearchSuggestions && searchSuggestionsList.length > 0 && (<framer_motion_1.motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                        <div className="p-2">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2">SUGGESTED SERVICES</p>
                          {searchSuggestionsList.map((suggestion, index) => (<button key={index} type="button" onClick={() => {
                    setSearchQuery(suggestion.name);
                    setShowSearchSuggestions(false);
                }} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors group">
                              <span className="text-2xl">{suggestion.icon}</span>
                              <div className="flex-1 text-left">
                                <p className="font-medium text-gray-900 dark:text-white">{suggestion.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{suggestion.category}</p>
                              </div>
                              <lucide_react_1.ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all"/>
                            </button>))}
                        </div>
                      </framer_motion_1.motion.div>)}
                  </framer_motion_1.AnimatePresence>
                </div>

                
                <div className="lg:w-80 relative">
                  <div className="relative">
                    <input_1.Input ref={locationInputRef} type="text" placeholder="Location" value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} onFocus={() => locationQuery && setShowLocationSuggestions(true)} onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)} className="h-14 pl-12 pr-10 text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 transition-all"/>
                    <lucide_react_1.MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <lucide_react_1.Navigation className="h-4 w-4 text-gray-400"/>
                    </button>
                  </div>

                  
                  <framer_motion_1.AnimatePresence>
                    {showLocationSuggestions && locationSuggestionsList.length > 0 && (<framer_motion_1.motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                        <div className="p-2">
                          {locationSuggestionsList.map((location, index) => (<button key={index} type="button" onClick={() => {
                    setLocationQuery(location);
                    setShowLocationSuggestions(false);
                }} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                              <lucide_react_1.MapPin className="w-4 h-4 text-gray-400"/>
                              <span className="text-gray-900 dark:text-white">{location}</span>
                            </button>))}
                        </div>
                      </framer_motion_1.motion.div>)}
                  </framer_motion_1.AnimatePresence>
                </div>

                
                <button_1.Button size="lg" onClick={() => refetch()} className="h-14 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all">
                  <lucide_react_1.Search className="w-5 h-5 mr-2"/>
                  Search
                </button_1.Button>
              </div>

              
              <div className="flex items-center gap-6 overflow-x-auto pb-2">
                <button_1.Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 shrink-0">
                  <lucide_react_1.Filter className="h-4 w-4"/>
                  <span>All Filters</span>
                  {Object.values(filters).filter(v => v && v !== "relevance" && v !== true && v !== "any").length > 0 && (<badge_1.Badge className="ml-1">{Object.values(filters).filter(v => v && v !== "relevance" && v !== true && v !== "any").length}</badge_1.Badge>)}
                </button_1.Button>

                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"/>

                
                <div className="flex items-center gap-2">
                  {quickFilters.map((filter, index) => {
            const Icon = filter.icon;
            return (<button_1.Button key={index} variant="ghost" size="sm" onClick={filter.action} className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400">
                        <Icon className="h-4 w-4"/>
                        <span>{filter.label}</span>
                      </button_1.Button>);
        })}
                </div>

                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 ml-auto"/>

                
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 shrink-0">
                  <button onClick={() => setViewMode("grid")} className={`p-2 rounded transition-all ${viewMode === "grid" ? "bg-white dark:bg-gray-800 shadow-sm" : ""}`}>
                    <lucide_react_1.Grid className="h-4 w-4"/>
                  </button>
                  <button onClick={() => setViewMode("list")} className={`p-2 rounded transition-all ${viewMode === "list" ? "bg-white dark:bg-gray-800 shadow-sm" : ""}`}>
                    <lucide_react_1.List className="h-4 w-4"/>
                  </button>
                  <button onClick={() => setViewMode("map")} className={`p-2 rounded transition-all ${viewMode === "map" ? "bg-white dark:bg-gray-800 shadow-sm" : ""}`}>
                    <lucide_react_1.Map className="h-4 w-4"/>
                  </button>
                </div>
              </div>

              
              <framer_motion_1.AnimatePresence>
                {showFilters && (<framer_motion_1.motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="pt-4 border-t dark:border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        
                        <div>
                          <label className="text-sm font-medium mb-3 block">Categories</label>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {categories?.map((cat) => (<label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={selectedCategories.includes(cat.id)} onChange={(e) => {
                    if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, cat.id]);
                    }
                    else {
                        setSelectedCategories(selectedCategories.filter(id => id !== cat.id));
                    }
                }} className="rounded text-blue-600"/>
                                <span className="text-sm">{cat.name}</span>
                              </label>))}
                          </div>
                        </div>

                        
                        <div>
                          <label className="text-sm font-medium mb-3 block">
                            Price Range: ${priceRange[0]} - ${priceRange[1]}
                          </label>
                          <slider_1.Slider value={priceRange} onValueChange={setPriceRange} min={0} max={1000} step={10} className="mt-6"/>
                        </div>

                        
                        <div>
                          <label className="text-sm font-medium mb-3 block">Minimum Rating</label>
                          <div className="space-y-2">
                            {[
                { value: "", label: "Any Rating" },
                { value: "4", label: "4+ Stars" },
                { value: "4.5", label: "4.5+ Stars" },
                { value: "5", label: "5 Stars Only" },
            ].map((option) => (<label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="rating" value={option.value} checked={filters.minRating === option.value} onChange={(e) => setFilters({ ...filters, minRating: e.target.value })} className="text-blue-600"/>
                                <span className="text-sm flex items-center gap-1">
                                  {option.label}
                                  {option.value && (<div className="flex items-center">
                                      {[...Array(Math.floor(Number(option.value)))].map((_, i) => (<lucide_react_1.Star key={i} className="w-3 h-3 text-yellow-500 fill-current"/>))}
                                    </div>)}
                                </span>
                              </label>))}
                          </div>
                        </div>

                        
                        <div>
                          <label className="text-sm font-medium mb-3 block">Service Options</label>
                          <div className="space-y-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={filters.isHomeService} onChange={(e) => setFilters({ ...filters, isHomeService: e.target.checked })} className="rounded text-blue-600"/>
                              <span className="text-sm">Home Service Available</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={filters.verifiedOnly} onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })} className="rounded text-blue-600"/>
                              <span className="text-sm">Verified Providers Only</span>
                            </label>
                            <div className="pt-2">
                              <label className="text-sm font-medium mb-2 block">Sort By</label>
                              <select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                                <option value="relevance">Most Relevant</option>
                                <option value="rating">Highest Rated</option>
                                <option value="price">Price: Low to High</option>
                                <option value="newest">Newest First</option>
                                <option value="popular">Most Popular</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      
                      <div className="mt-4 flex justify-end">
                        <button_1.Button variant="ghost" onClick={() => {
                setFilters({
                    query: "",
                    location: "",
                    categoryId: "",
                    minPrice: "",
                    maxPrice: "",
                    minRating: "",
                    isHomeService: false,
                    verifiedOnly: true,
                    sortBy: "relevance",
                    availability: "any",
                });
                setSearchQuery("");
                setLocationQuery("");
                setPriceRange([0, 500]);
                setSelectedCategories([]);
            }} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <lucide_react_1.X className="w-4 h-4 mr-2"/>
                          Clear All Filters
                        </button_1.Button>
                      </div>
                    </div>
                  </framer_motion_1.motion.div>)}
              </framer_motion_1.AnimatePresence>
            </div>
          </div>
        </div>

        
        <div className="container mx-auto px-4 py-8">
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-gray-600 dark:text-gray-400">
                Showing <span className="font-semibold text-gray-900 dark:text-white">{providers.length}</span> service providers
                {searchQuery && ` for "${searchQuery}"`}
                {locationQuery && ` in ${locationQuery}`}
              </p>
              {providers.length > 0 && (<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Sorted by {filters.sortBy === "relevance" ? "relevance" : filters.sortBy}
                </p>)}
            </div>
            
            
            {(searchQuery || locationQuery || Object.values(filters).some(v => v && v !== "relevance" && v !== true && v !== "any")) && (<div className="flex items-center gap-2 flex-wrap">
                {searchQuery && (<badge_1.Badge variant="secondary" className="flex items-center gap-1">
                    {searchQuery}
                    <button onClick={() => setSearchQuery("")}>
                      <lucide_react_1.X className="w-3 h-3"/>
                    </button>
                  </badge_1.Badge>)}
                {locationQuery && (<badge_1.Badge variant="secondary" className="flex items-center gap-1">
                    {locationQuery}
                    <button onClick={() => setLocationQuery("")}>
                      <lucide_react_1.X className="w-3 h-3"/>
                    </button>
                  </badge_1.Badge>)}
              </div>)}
          </div>

          
          {isLoading ? (<div className="flex flex-col items-center justify-center py-20">
              <lucide_react_1.Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4"/>
              <p className="text-gray-500 dark:text-gray-400">Finding the best providers for you...</p>
            </div>) : providers.length === 0 ? (<framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto mb-6 flex items-center justify-center">
                <lucide_react_1.Search className="w-12 h-12 text-gray-400"/>
              </div>
              <h3 className="text-xl font-semibold mb-2">No providers found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Try adjusting your filters or search in a different area</p>
              <button_1.Button onClick={() => {
                setFilters({
                    query: "",
                    location: "",
                    categoryId: "",
                    minPrice: "",
                    maxPrice: "",
                    minRating: "",
                    isHomeService: false,
                    verifiedOnly: true,
                    sortBy: "relevance",
                    availability: "any",
                });
                setSearchQuery("");
                setLocationQuery("");
                setPriceRange([0, 500]);
                setSelectedCategories([]);
            }}>
                Clear All Filters
              </button_1.Button>
            </framer_motion_1.motion.div>) : (<framer_motion_1.motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`grid gap-6 ${viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : viewMode === "list"
                    ? "grid-cols-1 max-w-4xl mx-auto"
                    : "grid-cols-1"}`}>
              {viewMode === "map" ? (<div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-[600px] flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">Map view coming soon</p>
                </div>) : (providers.map((provider, index) => (<framer_motion_1.motion.div key={provider.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -5 }}>
                    <card_1.Card className={`h-full overflow-hidden hover:shadow-2xl transition-all group ${viewMode === "list" ? "flex" : ""}`}>
                      
                      <div className={`relative bg-gradient-to-br from-blue-400 to-purple-600 ${viewMode === "list" ? "w-48 h-full" : "h-48"}`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-6xl">👤</span>
                        </div>
                        {provider.isVerified && (<div className="absolute top-3 right-3 bg-white dark:bg-gray-900 rounded-full p-1.5 shadow-lg">
                            <lucide_react_1.Shield className="w-4 h-4 text-blue-600"/>
                          </div>)}
                        <button className="absolute top-3 left-3 bg-white dark:bg-gray-900 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <lucide_react_1.Heart className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors"/>
                        </button>
                      </div>

                      
                      <div className="flex-1 p-5">
                        <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {provider.businessName}
                        </h3>
                        
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-1">
                            <lucide_react_1.Star className="w-4 h-4 text-yellow-500 fill-current"/>
                            <span className="font-semibold">{provider.averageRating || "4.8"}</span>
                          </div>
                          <span className="text-gray-500 text-sm">({provider.totalReviews || 0} reviews)</span>
                          {provider.responseTime && (<>
                              <span className="text-gray-300 dark:text-gray-600">•</span>
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <lucide_react_1.Clock className="w-3 h-3"/>
                                Responds in {provider.responseTime}
                              </span>
                            </>)}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {provider.businessDescription}
                        </p>

                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                          <lucide_react_1.MapPin className="w-4 h-4"/>
                          <span className="truncate">{provider.businessAddress}</span>
                        </div>

                        
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {provider.services?.slice(0, 3).map((service, idx) => (<badge_1.Badge key={idx} variant="secondary" className="text-xs">
                                {service.name}
                              </badge_1.Badge>))}
                            {provider.services?.length > 3 && (<badge_1.Badge variant="outline" className="text-xs">
                                +{provider.services.length - 3} more
                              </badge_1.Badge>)}
                          </div>
                          
                          {provider.startingPrice && (<div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">Starting from</span>
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                {(0, utils_1.formatPrice)(provider.startingPrice)}
                              </span>
                            </div>)}
                        </div>

                        
                        <div className="flex gap-2 mt-4">
                          <button_1.Button variant="outline" className="flex-1" onClick={() => router.push(`/${locale}/providers/${provider.id}`)}>
                            View Profile
                          </button_1.Button>
                          <button_1.Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" onClick={() => router.push(`/${locale}/booking?providerId=${provider.id}`)}>
                            Book Now
                          </button_1.Button>
                        </div>
                      </div>
                    </card_1.Card>
                  </framer_motion_1.motion.div>)))}
            </framer_motion_1.motion.div>)}

          
          {providers.length > 0 && (<div className="mt-12 flex justify-center">
              <button_1.Button variant="outline" size="lg" className="min-w-[200px]">
                Load More Providers
              </button_1.Button>
            </div>)}
        </div>
      </main>
      <footer_1.Footer />
    </>);
}
//# sourceMappingURL=page.js.map