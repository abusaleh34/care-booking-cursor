import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDuplicateEmailIndex1734785000000 implements MigrationInterface {
  name = 'RemoveDuplicateEmailIndex1734785000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the duplicate index if it exists
    try {
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_97672ac88f789774dd47f7c8be"`);
    } catch (error) {
      console.log('Index might not exist, continuing...');
    }

    // Ensure the unique constraint exists on email column
    try {
      await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be" UNIQUE ("email")`);
    } catch (error) {
      console.log('Unique constraint might already exist, continuing...');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert changes if needed
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_97672ac88f789774dd47f7c8be"`);
  }
}