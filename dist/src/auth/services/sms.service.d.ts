import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
export declare class SmsService {
    private readonly configService;
    private readonly tokenService;
    private readonly logger;
    private readonly twilioClient;
    constructor(configService: ConfigService, tokenService: TokenService);
    sendVerificationCode(phone: string): Promise<void>;
    verifyCode(phone: string, code: string): Promise<boolean>;
}
