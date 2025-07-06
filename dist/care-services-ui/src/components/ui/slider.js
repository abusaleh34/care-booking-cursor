"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Slider = void 0;
const React = require("react");
const SliderPrimitive = require("@radix-ui/react-slider");
const utils_1 = require("@/lib/utils");
const Slider = React.forwardRef(({ className, ...props }, ref) => (<SliderPrimitive.Root ref={ref} className={(0, utils_1.cn)("relative flex w-full touch-none select-none items-center", className)} {...props}>
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-blue-600 to-purple-600"/>
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-lg"/>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-lg"/>
  </SliderPrimitive.Root>));
exports.Slider = Slider;
Slider.displayName = SliderPrimitive.Root.displayName;
//# sourceMappingURL=slider.js.map