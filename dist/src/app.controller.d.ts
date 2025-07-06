import { Response } from 'express';
export declare class AppController {
    getHello(): {
        message: string;
        version: string;
        documentation: string;
    };
    getDemoLogin(res: Response): void;
    getDashboard(res: Response): void;
    getAdminDashboard(res: Response): void;
    getLoginInterface(res: Response): void;
}
