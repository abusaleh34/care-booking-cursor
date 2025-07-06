"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMissingFields1734537600000 = void 0;
class AddMissingFields1734537600000 {
    constructor() {
        this.name = 'AddMissingFields1734537600000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mfa_enabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_ip" varchar(45)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_mfa_enabled" ON "users" ("mfa_enabled")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_mfa_enabled"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "last_login_ip"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "mfa_enabled"`);
    }
}
exports.AddMissingFields1734537600000 = AddMissingFields1734537600000;
//# sourceMappingURL=1734537600000-AddMissingFields.js.map