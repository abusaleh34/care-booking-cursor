export declare class EnableMfaDto {
    password: string;
}
export declare class VerifyMfaSetupDto {
    code: string;
}
export declare class DisableMfaDto {
    password: string;
    mfaCode?: string;
    backupCode?: string;
}
export declare class VerifyMfaDto {
    code?: string;
    backupCode?: string;
}
