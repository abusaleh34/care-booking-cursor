"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixLatLongPrecision1734795000000 = void 0;
class FixLatLongPrecision1734795000000 {
    constructor() {
        this.name = 'FixLatLongPrecision1734795000000';
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
exports.FixLatLongPrecision1734795000000 = FixLatLongPrecision1734795000000;
//# sourceMappingURL=1734795000000-FixLatLongPrecision.js.map