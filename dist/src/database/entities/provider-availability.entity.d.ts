import { ServiceProvider } from './service-provider.entity';
export declare class ProviderAvailability {
    id: string;
    provider_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
    created_at: Date;
    provider: ServiceProvider;
}
