"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const typeorm_1 = require("typeorm");
async function checkIndexes() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn'],
    });
    const dataSource = app.get(typeorm_1.DataSource);
    console.log('🔍 Checking database indexes on users table...\n');
    try {
        const indexes = await dataSource.query(`
      SELECT 
        indexname,
        indexdef,
        schemaname,
        tablename
      FROM pg_indexes
      WHERE tablename = 'users'
      ORDER BY indexname;
    `);
        console.log('📋 Current indexes on users table:');
        console.log('=====================================');
        indexes.forEach(index => {
            console.log(`\nIndex Name: ${index.indexname}`);
            console.log(`Definition: ${index.indexdef}`);
        });
        const emailIndexes = await dataSource.query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'users'
        AND indexdef LIKE '%email%'
      ORDER BY indexname;
    `);
        console.log('\n\n📧 Indexes involving email column:');
        console.log('===================================');
        if (emailIndexes.length > 0) {
            emailIndexes.forEach(index => {
                console.log(`\nIndex Name: ${index.indexname}`);
                console.log(`Definition: ${index.indexdef}`);
            });
            if (emailIndexes.length > 1) {
                console.log('\n⚠️  WARNING: Multiple indexes found on email column!');
                console.log('This might be causing the conflict.');
            }
        }
        else {
            console.log('No indexes found on email column');
        }
        const constraints = await dataSource.query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        ccu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'users' 
        AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
      ORDER BY tc.constraint_name;
    `);
        console.log('\n\n🔒 Unique constraints on users table:');
        console.log('=====================================');
        constraints.forEach(constraint => {
            console.log(`\nConstraint: ${constraint.constraint_name}`);
            console.log(`Type: ${constraint.constraint_type}`);
            console.log(`Column: ${constraint.column_name}`);
        });
        const problematicIndex = await dataSource.query(`
      SELECT 1 
      FROM pg_indexes 
      WHERE indexname = 'IDX_97672ac88f789774dd47f7c8be'
    `);
        console.log('\n\n🔍 Checking for problematic index:');
        console.log('==================================');
        if (problematicIndex && problematicIndex.length > 0) {
            console.log('❌ Found problematic index: IDX_97672ac88f789774dd47f7c8be');
            console.log('This index needs to be removed by the migration.');
        }
        else {
            console.log('✅ Problematic index not found (good!)');
        }
    }
    catch (error) {
        console.error('❌ Error checking indexes:', error.message);
    }
    finally {
        await app.close();
    }
}
checkIndexes().catch(err => {
    console.error('❌ Script failed:', err);
    process.exit(1);
});
//# sourceMappingURL=check-indexes.js.map