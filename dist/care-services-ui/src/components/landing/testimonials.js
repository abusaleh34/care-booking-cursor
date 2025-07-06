"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Testimonials = Testimonials;
const react_1 = require("react");
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
const card_1 = require("@/components/ui/card");
const testimonials = [
    {
        id: 1,
        name: "Sarah Johnson",
        role: "Regular Customer",
        content: "The convenience of booking beauty services through this platform is unmatched. I've been using it for 6 months and every provider has been professional and punctual.",
        rating: 5,
        avatar: "👩‍💼",
        service: "Spa & Massage"
    },
    {
        id: 2,
        name: "Ahmed Al-Rahman",
        role: "Fitness Enthusiast",
        content: "Found my personal trainer through this app and it changed my life. The booking process is seamless and the quality of professionals is exceptional.",
        rating: 5,
        avatar: "👨‍💻",
        service: "Personal Training"
    },
    {
        id: 3,
        name: "Fatima Al-Zahra",
        role: "Working Mother",
        content: "As a busy mom, having beauticians come to my home is a game-changer. The app makes it so easy to find trusted professionals in my area.",
        rating: 5,
        avatar: "👩‍👧",
        service: "Home Beauty Services"
    },
    {
        id: 4,
        name: "Michael Chen",
        role: "Business Professional",
        content: "Quick, reliable, and professional. I use this for regular grooming services and have never been disappointed. Highly recommend!",
        rating: 5,
        avatar: "👨‍💼",
        service: "Hair Styling"
    },
];
function Testimonials() {
    const [currentIndex, setCurrentIndex] = (0, react_1.useState)(0);
    const nextTestimonial = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };
    const prevTestimonial = () => {
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };
    return (<section className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-72 h-72 bg-purple-300 dark:bg-purple-700 rounded-full opacity-20 blur-3xl"/>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-300 dark:bg-blue-700 rounded-full opacity-20 blur-3xl"/>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <lucide_react_1.Star className="w-4 h-4"/>
            <span>Customer Stories</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            What Our Customers Say
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have transformed their self-care routine
          </p>
        </framer_motion_1.motion.div>

        
        <div className="max-w-4xl mx-auto relative">
          <framer_motion_1.AnimatePresence mode="wait">
            <framer_motion_1.motion.div key={currentIndex} initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }} transition={{ duration: 0.5 }}>
              <card_1.Card className="bg-white dark:bg-gray-800 shadow-2xl border-0 overflow-hidden">
                <div className="p-8 md:p-12">
                  
                  <div className="mb-6">
                    <lucide_react_1.Quote className="w-12 h-12 text-blue-600 dark:text-blue-400 opacity-20"/>
                  </div>

                  
                  <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                    "{testimonials[currentIndex].content}"
                  </p>

                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-3xl">
                        {testimonials[currentIndex].avatar}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                          {testimonials[currentIndex].name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {testimonials[currentIndex].role}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {testimonials[currentIndex].service}
                        </p>
                      </div>
                    </div>

                    
                    <div className="flex items-center gap-1">
                      {[...Array(testimonials[currentIndex].rating)].map((_, i) => (<lucide_react_1.Star key={i} className="w-5 h-5 text-yellow-500 fill-current"/>))}
                    </div>
                  </div>
                </div>
              </card_1.Card>
            </framer_motion_1.motion.div>
          </framer_motion_1.AnimatePresence>

          
          <button onClick={prevTestimonial} className="absolute left-0 md:-left-16 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:shadow-xl transition-all">
            <lucide_react_1.ChevronLeft className="w-6 h-6"/>
          </button>
          <button onClick={nextTestimonial} className="absolute right-0 md:-right-16 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:shadow-xl transition-all">
            <lucide_react_1.ChevronRight className="w-6 h-6"/>
          </button>
        </div>

        
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (<button key={index} onClick={() => setCurrentIndex(index)} className={`w-2 h-2 rounded-full transition-all ${currentIndex === index
                ? "w-8 bg-blue-600 dark:bg-blue-400"
                : "bg-gray-300 dark:bg-gray-600"}`}/>))}
        </div>

        
        <framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">4.9/5</h3>
            <p className="text-gray-600 dark:text-gray-400">Average Rating</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">10K+</h3>
            <p className="text-gray-600 dark:text-gray-400">Happy Customers</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">50K+</h3>
            <p className="text-gray-600 dark:text-gray-400">Services Completed</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">98%</h3>
            <p className="text-gray-600 dark:text-gray-400">Satisfaction Rate</p>
          </div>
        </framer_motion_1.motion.div>
      </div>
    </section>);
}
//# sourceMappingURL=testimonials.js.map