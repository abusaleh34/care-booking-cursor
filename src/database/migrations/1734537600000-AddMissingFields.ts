import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingFields1734537600000 implements MigrationInterface {
  name = 'AddMissingFields1734537600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add mfa_enabled and last_login_ip to users table
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mfa_enabled" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_ip" varchar(45)`,
    );

    // Create indexes for performance
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_mfa_enabled" ON "users" ("mfa_enabled")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_mfa_enabled"`);

    // Drop columns
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "last_login_ip"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "mfa_enabled"`);
  }
}