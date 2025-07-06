import { Response } from 'express';
export declare class MockAuthController {
    private users;
    register(registerDto: any, res: Response): Promise<Response<any, Record<string, any>>>;
    login(loginDto: any, res: Response): Promise<Response<any, Record<string, any>>>;
    demoReset(res: Response): Promise<Response<any, Record<string, any>>>;
}
