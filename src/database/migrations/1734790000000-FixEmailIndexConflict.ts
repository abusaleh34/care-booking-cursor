import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixEmailIndexConflict1734790000000 implements MigrationInterface {
  name = 'FixEmailIndexConflict1734790000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, check and drop the conflicting index if it exists
    try {
      // Check if the index exists
      const indexExists = await queryRunner.query(`
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'IDX_97672ac88f789774dd47f7c8be'
      `);

      if (indexExists && indexExists.length > 0) {
        console.log('Dropping existing index IDX_97672ac88f789774dd47f7c8be...');
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_97672ac88f789774dd47f7c8be"`);
      }
    } catch (error) {
      console.log('Index might not exist, continuing...');
    }

    // Check if there's already a unique constraint on email
    const constraintExists = await queryRunner.query(`
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'users' 
        AND tc.constraint_type = 'UNIQUE'
        AND ccu.column_name = 'email'
    `);

    if (!constraintExists || constraintExists.length === 0) {
      // Create unique constraint on email if it doesn't exist
      console.log('Creating unique constraint on email column...');
      try {
        await queryRunner.query(`
          ALTER TABLE "users" 
          ADD CONSTRAINT "UQ_users_email" UNIQUE ("email")
        `);
      } catch (error) {
        // If constraint already exists with a different name, that's okay
        console.log('Unique constraint might already exist with a different name');
      }
    }

    // Drop any other duplicate indexes on email column
    const duplicateIndexes = await queryRunner.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'users' 
        AND indexdef LIKE '%email%'
        AND indexname != 'users_pkey'
        AND indexname NOT LIKE 'UQ_%'
    `);

    if (duplicateIndexes && duplicateIndexes.length > 0) {
      for (const index of duplicateIndexes) {
        console.log(`Dropping duplicate index: ${index.indexname}`);
        await queryRunner.query(`DROP INDEX IF EXISTS "${index.indexname}"`);
      }
    }

    // Ensure composite indexes are properly created
    // Check if composite index on isActive and isVerified exists
    const compositeIndexExists = await queryRunner.query(`
      SELECT 1 
      FROM pg_indexes 
      WHERE tablename = 'users'
        AND indexdef LIKE '%is_active%'
        AND indexdef LIKE '%is_verified%'
    `);

    if (!compositeIndexExists || compositeIndexExists.length === 0) {
      console.log('Creating composite index on isActive and isVerified...');
      await queryRunner.query(`
        CREATE INDEX "IDX_users_is_active_is_verified" 
        ON "users" ("is_active", "is_verified")
      `);
    }

    // Check if index on createdAt exists
    const createdAtIndexExists = await queryRunner.query(`
      SELECT 1 
      FROM pg_indexes 
      WHERE tablename = 'users'
        AND indexdef LIKE '%created_at%'
        AND indexname NOT LIKE 'users_pkey'
    `);

    if (!createdAtIndexExists || createdAtIndexExists.length === 0) {
      console.log('Creating index on createdAt...');
      await queryRunner.query(`
        CREATE INDEX "IDX_users_created_at" 
        ON "users" ("created_at")
      `);
    }

    console.log('Migration completed successfully!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // In the down migration, we'll restore the original state
    // But we'll be careful not to create duplicates

    // Drop the constraints we created
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_users_email"`);

    // Drop the indexes we created
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_is_active_is_verified"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_created_at"`);

    // Recreate the original index (if needed for rollback compatibility)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_97672ac88f789774dd47f7c8be" 
      ON "users" ("email")
    `);
  }
}
