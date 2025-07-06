interface LocaleLayoutProps {
    children: React.ReactNode;
    params: Promise<{
        locale: string;
    }>;
}
export default function LocaleLayout({ children, params, }: LocaleLayoutProps): Promise<import("react").JSX.Element>;
export declare function generateStaticParams(): any;
export {};
