import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixLatLongPrecision1734795000000 implements MigrationInterface {
  name = 'FixLatLongPrecision1734795000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Fix latitude precision to handle values like 37.xxxxx (needs at least precision 10)
    // Fix longitude precision to handle values like -122.xxxxx (needs at least precision 12)

    // Drop existing columns
    await queryRunner.query(`ALTER TABLE "service_providers" DROP COLUMN IF EXISTS "latitude"`);
    await queryRunner.query(`ALTER TABLE "service_providers" DROP COLUMN IF EXISTS "longitude"`);

    // Recreate with proper precision
    // Latitude: -90 to 90 (precision 11, scale 8 allows -90.99999999 to 90.99999999)
    // Longitude: -180 to 180 (precision 12, scale 8 allows -180.99999999 to 180.99999999)
    await queryRunner.query(`ALTER TABLE "service_providers" ADD "latitude" numeric(11,8)`);
    await queryRunner.query(`ALTER TABLE "service_providers" ADD "longitude" numeric(12,8)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to original precision
    await queryRunner.query(`ALTER TABLE "service_providers" DROP COLUMN IF EXISTS "latitude"`);
    await queryRunner.query(`ALTER TABLE "service_providers" DROP COLUMN IF EXISTS "longitude"`);

    await queryRunner.query(`ALTER TABLE "service_providers" ADD "latitude" numeric(10,8)`);
    await queryRunner.query(`ALTER TABLE "service_providers" ADD "longitude" numeric(11,8)`);
  }
}
