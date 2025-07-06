import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixServiceProviderCoordinates1735000000000 implements MigrationInterface {
  name = 'FixServiceProviderCoordinates1735000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing columns with incorrect precision
    await queryRunner.query(`ALTER TABLE "service_providers" DROP COLUMN IF EXISTS "latitude"`);
    await queryRunner.query(`ALTER TABLE "service_providers" DROP COLUMN IF EXISTS "longitude"`);
    
    // Recreate columns with proper precision
    // Latitude: -90 to 90 degrees (precision 11, scale 8)
    // Longitude: -180 to 180 degrees (precision 12, scale 8)
    await queryRunner.query(`ALTER TABLE "service_providers" ADD "latitude" numeric(11,8)`);
    await queryRunner.query(`ALTER TABLE "service_providers" ADD "longitude" numeric(12,8)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to original columns
    await queryRunner.query(`ALTER TABLE "service_providers" DROP COLUMN IF EXISTS "latitude"`);
    await queryRunner.query(`ALTER TABLE "service_providers" DROP COLUMN IF EXISTS "longitude"`);
    
    // Recreate with original precision
    await queryRunner.query(`ALTER TABLE "service_providers" ADD "latitude" numeric(10,8)`);
    await queryRunner.query(`ALTER TABLE "service_providers" ADD "longitude" numeric(11,8)`);
  }
}