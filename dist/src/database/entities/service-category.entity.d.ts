export declare class ServiceCategory {
    id: string;
    name: string;
    description: string;
    iconUrl: string;
    isActive: boolean;
    sortOrder: number;
    createdAt: Date;
    services: any[];
    get serviceCount(): number;
}
