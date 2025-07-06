import { User } from './user.entity';
export declare class UserProfile {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
    dateOfBirth: Date;
    gender: string;
    languagePreference: string;
    timezone: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    get fullName(): string;
    get age(): number | null;
}
