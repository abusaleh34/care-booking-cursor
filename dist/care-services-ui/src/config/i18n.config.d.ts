export declare const locales: readonly ["en", "ar"];
export type Locale = (typeof locales)[number];
export declare const defaultLocale: Locale;
export declare const localeNames: Record<Locale, string>;
export declare const localeFlags: Record<Locale, string>;
export declare const directions: Record<Locale, "ltr" | "rtl">;
