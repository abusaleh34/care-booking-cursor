"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixEmailIndexConflict1734790000000 = void 0;
class FixEmailIndexConflict1734790000000 {
    constructor() {
        this.name = 'FixEmailIndexConflict1734790000000';
    }
    async up(queryRunner) {
        try {
            const indexExists = await queryRunner.query(`
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'IDX_97672ac88f789774dd47f7c8be'
      `);
            if (indexExists && indexExists.length > 0) {
                console.log('Dropping existing index IDX_97672ac88f789774dd47f7c8be...');
                await queryRunner.query(`DROP INDEX IF EXISTS "IDX_97672ac88f789774dd47f7c8be"`);
            }
        }
        catch (error) {
            console.log('Index might not exist, continuing...');
        }
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
            console.log('Creating unique constraint on email column...');
            try {
                await queryRunner.query(`
          ALTER TABLE "users" 
          ADD CONSTRAINT "UQ_users_email" UNIQUE ("email")
        `);
            }
            catch (error) {
                console.log('Unique constraint might already exist with a different name');
            }
        }
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
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_users_email"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_is_active_is_verified"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_created_at"`);
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_97672ac88f789774dd47f7c8be" 
      ON "users" ("email")
    `);
    }
}
exports.FixEmailIndexConflict1734790000000 = FixEmailIndexConflict1734790000000;
//# sourceMappingURL=1734790000000-FixEmailIndexConflict.js.map