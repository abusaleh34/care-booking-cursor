"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeroSection = HeroSection;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const next_intl_1 = require("next-intl");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const framer_motion_1 = require("framer-motion");
function HeroSection() {
    const t = (0, next_intl_1.useTranslations)("landing.hero");
    const tCommon = (0, next_intl_1.useTranslations)("common");
    const locale = (0, next_intl_1.useLocale)();
    const router = (0, navigation_1.useRouter)();
    const [searchQuery, setSearchQuery] = (0, react_1.useState)("");
    const [location, setLocation] = (0, react_1.useState)("");
    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchQuery)
            params.append("q", searchQuery);
        if (location)
            params.append("location", location);
        router.push(`/${locale}/services?${params.toString()}`);
    };
    return (<section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10"/>
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"/>
      
      
      <framer_motion_1.motion.div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
        }} transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
        }}/>
      <framer_motion_1.motion.div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" animate={{
            x: [0, -50, 0],
            y: [0, 30, 0],
        }} transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
        }}/>

      <div className="container relative z-10 mx-auto px-4 py-20">
        <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">{t("title")}</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-12">
            {t("subtitle")}
          </p>

          
          <framer_motion_1.motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} onSubmit={handleSearch} className="glass rounded-2xl p-2 md:p-3 max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1">
                <input_1.Input type="text" placeholder={t("searchPlaceholder")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-12 md:h-14 px-4 md:px-6 text-base border-0 bg-background/50" icon={<lucide_react_1.Search className="h-5 w-5"/>}/>
              </div>
              <div className="flex-1 md:flex-initial md:w-72">
                <input_1.Input type="text" placeholder={t("locationPlaceholder")} value={location} onChange={(e) => setLocation(e.target.value)} className="h-12 md:h-14 px-4 md:px-6 text-base border-0 bg-background/50" icon={<lucide_react_1.MapPin className="h-5 w-5"/>}/>
              </div>
              <button_1.Button type="submit" size="lg" className="h-12 md:h-14 px-8 text-base font-semibold">
                {tCommon("search")}
              </button_1.Button>
            </div>
          </framer_motion_1.motion.form>

          
          <framer_motion_1.motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }} className="mt-12 flex flex-wrap justify-center gap-2 md:gap-3">
            <span className="text-sm text-muted-foreground">
              Popular:
            </span>
            {["Massage", "Hair Styling", "Nail Care", "Personal Training", "Yoga"].map((service) => (<button key={service} onClick={() => {
                setSearchQuery(service);
                handleSearch(new Event("submit"));
            }} className="text-sm px-3 py-1 rounded-full bg-accent hover:bg-accent/80 transition-colors">
                {service}
              </button>))}
          </framer_motion_1.motion.div>
        </framer_motion_1.motion.div>
      </div>
    </section>);
}
//# sourceMappingURL=hero-section.js.map