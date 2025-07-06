"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HowItWorksSection = HowItWorksSection;
const next_intl_1 = require("next-intl");
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
const steps = [
    {
        icon: lucide_react_1.Search,
        key: "step1",
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
    },
    {
        icon: lucide_react_1.UserCheck,
        key: "step2",
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
    },
    {
        icon: lucide_react_1.Calendar,
        key: "step3",
        color: "text-green-500",
        bgColor: "bg-green-500/10",
    },
    {
        icon: lucide_react_1.Sparkles,
        key: "step4",
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
    },
];
function HowItWorksSection() {
    const t = (0, next_intl_1.useTranslations)("landing.howItWorks");
    const locale = (0, next_intl_1.useLocale)();
    const isRTL = locale === "ar";
    return (<section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("title")}
          </h2>
        </framer_motion_1.motion.div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            
            <div className="hidden lg:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 opacity-20"/>
            
            {steps.map((step, index) => {
            const Icon = step.icon;
            return (<framer_motion_1.motion.div key={step.key} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.1 }} className="relative text-center">
                  
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center text-sm font-bold">
                    {isRTL ? 4 - index : index + 1}
                  </div>
                  
                  
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${step.bgColor} mb-4`}>
                    <Icon className={`h-10 w-10 ${step.color}`}/>
                  </div>
                  
                  
                  <h3 className="text-lg font-semibold mb-2">
                    {t(`${step.key}.title`)}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t(`${step.key}.description`)}
                  </p>
                  
                  
                  {index < steps.length - 1 && (<div className="lg:hidden flex justify-center mt-6">
                      <framer_motion_1.motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-muted-foreground">
                        ↓
                      </framer_motion_1.motion.div>
                    </div>)}
                </framer_motion_1.motion.div>);
        })}
          </div>
        </div>
      </div>
    </section>);
}
//# sourceMappingURL=how-it-works-section.js.map