import { ServiceProvider } from './service-provider.entity';
export declare class ProviderBlockedTimes {
    id: string;
    provider_id: string;
    blocked_date: Date;
    start_time: string;
    end_time: string;
    reason: string;
    is_recurring: boolean;
    created_at: Date;
    provider: ServiceProvider;
}
