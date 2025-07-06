"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixServiceProviderCoordinates1735000000000 = void 0;
class FixServiceProviderCoordinates1735000000000 {
    constructor() {
        this.name = 'FixServiceProviderCoordinates1735000000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "service_providers" DROP COLUMN IF EXISTS "latitude"`);
        await queryRunner.query(`ALTER TABLE "service_providers" DROP COLUMN IF EXISTS "longitude"`);
        await queryRunner.query(`ALTER TABLE "service_providers" ADD "latitude" numeric(11,8)`);
        await queryRunner.query(`ALTER TABLE "service_providers" ADD "longitude" numeric(12,8)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "service_providers" DROP COLUMN IF EXISTS "latitude"`);
        await queryRunner.query(`ALTER TABLE "service_providers" DROP COLUMN IF EXISTS "longitude"`);
        await queryRunner.query(`ALTER TABLE "service_providers" ADD "latitude" numeric(10,8)`);
        await queryRunner.query(`ALTER TABLE "service_providers" ADD "longitude" numeric(11,8)`);
    }
}
exports.FixServiceProviderCoordinates1735000000000 = FixServiceProviderCoordinates1735000000000;
//# sourceMappingURL=1735000000000-FixServiceProviderCoordinates.js.map