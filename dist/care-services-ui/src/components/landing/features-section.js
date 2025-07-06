"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeaturesSection = FeaturesSection;
const next_intl_1 = require("next-intl");
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
const card_1 = require("@/components/ui/card");
const features = [
    {
        icon: lucide_react_1.Shield,
        key: "verified",
    },
    {
        icon: lucide_react_1.Clock,
        key: "convenient",
    },
    {
        icon: lucide_react_1.CreditCard,
        key: "secure",
    },
    {
        icon: lucide_react_1.Award,
        key: "quality",
    },
];
function FeaturesSection() {
    const t = (0, next_intl_1.useTranslations)("landing.features");
    return (<section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("title")}
          </h2>
        </framer_motion_1.motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (<framer_motion_1.motion.div key={feature.key} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.1 }}>
                <card_1.GlassCard className="h-full text-center group hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors mb-4">
                      <Icon className="h-8 w-8 text-primary"/>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">
                      {t(`${feature.key}.title`)}
                    </h3>
                    <p className="text-muted-foreground">
                      {t(`${feature.key}.description`)}
                    </p>
                  </div>
                </card_1.GlassCard>
              </framer_motion_1.motion.div>);
        })}
        </div>
      </div>
    </section>);
}
//# sourceMappingURL=features-section.js.map