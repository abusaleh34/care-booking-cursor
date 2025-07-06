"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: {
                    50: "#f0f9ff",
                    100: "#e0f2fe",
                    200: "#bae6fd",
                    300: "#7dd3fc",
                    400: "#38bdf8",
                    500: "#0ea5e9",
                    600: "#0284c7",
                    700: "#0369a1",
                    800: "#075985",
                    900: "#0c4a6e",
                    950: "#082f49",
                },
                secondary: {
                    50: "#fdf4ff",
                    100: "#fae8ff",
                    200: "#f5d0fe",
                    300: "#f0abfc",
                    400: "#e879f9",
                    500: "#d946ef",
                    600: "#c026d3",
                    700: "#a21caf",
                    800: "#86198f",
                    900: "#701a75",
                    950: "#4a044e",
                },
                gray: {
                    50: "#f9fafb",
                    100: "#f3f4f6",
                    200: "#e5e7eb",
                    300: "#d1d5db",
                    400: "#9ca3af",
                    500: "#6b7280",
                    600: "#4b5563",
                    700: "#374151",
                    800: "#1f2937",
                    900: "#111827",
                    950: "#030712",
                },
            },
            fontFamily: {
                sans: ["Inter", "ui-sans-serif", "system-ui"],
                arabic: ["Tajawal", "Cairo", "ui-sans-serif", "system-ui"],
            },
            animation: {
                "fade-in": "fadeIn 0.5s ease-in-out",
                "fade-out": "fadeOut 0.5s ease-in-out",
                "slide-in": "slideIn 0.3s ease-out",
                "slide-out": "slideOut 0.3s ease-out",
                shimmer: "shimmer 2s linear infinite",
                pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                fadeOut: {
                    "0%": { opacity: "1" },
                    "100%": { opacity: "0" },
                },
                slideIn: {
                    "0%": { transform: "translateY(-10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                slideOut: {
                    "0%": { transform: "translateY(0)", opacity: "1" },
                    "100%": { transform: "translateY(-10px)", opacity: "0" },
                },
                shimmer: {
                    "0%": {
                        backgroundPosition: "-1000px 0",
                    },
                    "100%": {
                        backgroundPosition: "1000px 0",
                    },
                },
            },
            boxShadow: {
                glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
                "glass-dark": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                shimmer: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)",
            },
        },
    },
    plugins: [
        require("tailwindcss-rtl"),
        require("@tailwindcss/forms"),
        require("@tailwindcss/typography"),
    ],
};
exports.default = config;
//# sourceMappingURL=tailwind.config.js.map