#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
async function createOptimalIndexes(dataSource) {
    const results = [];
    const indexes = [
        {
            name: 'idx_bookings_provider_date',
            sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_provider_date ON bookings(provider_id, booking_date);',
            description: 'Optimize provider booking lookups by date'
        },
        {
            name: 'idx_bookings_customer_status',
            sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_customer_status ON bookings(customer_id, status);',
            description: 'Optimize customer booking status queries'
        },
        {
            name: 'idx_bookings_status_date',
            sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_status_date ON bookings(status, booking_date);',
            description: 'Optimize booking status and date filtering'
        },
        {
            name: 'idx_bookings_created_at',
            sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);',
            description: 'Optimize recent bookings queries'
        },
        {
            name: 'idx_services_category_active',
            sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_category_active ON services(category_id, is_active);',
            description: 'Optimize service category filtering'
        },
        {
            name: 'idx_services_provider_active',
            sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_provider_active ON services(provider_id, is_active);',
            description: 'Optimize provider service lookups'
        },
        {
            name: 'idx_services_price_active',
            sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_price_active ON services(price, is_active);',
            description: 'Optimize price-based service searches'
        },
        {
            name: 'idx_providers_verified_active',
            sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_providers_verified_active ON service_providers(is_verified, is_active);',
            description: 'Optimize verified provider queries'
        },
        {
            name: 'idx_providers_rating',
            sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_providers_rating ON service_providers(average_rating DESC) WHERE average_rating IS NOT NULL;',
            description: 'Optimize provider ranking by rating'
        },
        {
            name: 'idx_reviews_provider_visible',
            sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_provider_visible ON reviews(provider_id, is_visible);',
            description: 'Optimize provider review queries'
        },
        {
            name: 'idx_reviews_customer_date',
            sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_customer_date ON reviews(customer_id, created_at DESC);',
            description: 'Optimize customer review history'
        },
        {
            name: 'idx_reviews_rating_date',
            sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_rating_date ON reviews(rating, created_at DESC);',
            description: 'Optimize review sorting and filtering'
        },
        {
            name: 'idx_users_email_active',
            sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active ON users(email, is_active) WHERE is_active = true;',
            description: 'Optimize active user email lookups'
        },
        {
            name: 'idx_users_created_at',
            sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at DESC);',
            description: 'Optimize user registration analytics'
        },
        {
            name: 'idx_user_roles_user_type',
            sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_type ON user_roles(user_id, role_type);',
            description: 'Optimize user role queries'
        },
        {
            name: 'idx_availability_provider_date',
            sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_availability_provider_date ON provider_availability(provider_id, date);',
            description: 'Optimize provider availability lookups'
        },
        {
            name: 'idx_blocked_times_provider_date',
            sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blocked_times_provider_date ON provider_blocked_times(provider_id, start_time, end_time);',
            description: 'Optimize blocked time checks'
        },
        {
            name: 'idx_conversations_participants',
            sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_participants ON conversations(customer_id, provider_id);',
            description: 'Optimize conversation lookups'
        },
        {
            name: 'idx_messages_conversation_date',
            sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_date ON messages(conversation_id, created_at DESC);',
            description: 'Optimize message ordering'
        },
        {
            name: 'idx_admin_users_level_active',
            sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_users_level_active ON admin_users(admin_level, is_active);',
            description: 'Optimize admin user filtering'
        },
        {
            name: 'idx_audit_logs_date_action',
            sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_date_action ON audit_logs(created_at DESC, action);',
            description: 'Optimize audit log queries'
        },
        {
            name: 'idx_services_search',
            sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_search ON services 
            USING gin(to_tsvector('english', name || ' ' || description));`,
            description: 'Optimize service full-text search'
        },
        {
            name: 'idx_providers_search',
            sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_providers_search ON service_providers 
            USING gin(to_tsvector('english', business_name || ' ' || COALESCE(description, '')));`,
            description: 'Optimize provider full-text search'
        }
    ];
    console.log(`\n🚀 Creating ${indexes.length} performance indexes...\n`);
    for (const index of indexes) {
        const startTime = Date.now();
        try {
            console.log(`Creating ${index.name}: ${index.description}`);
            await dataSource.query(index.sql);
            const duration = Date.now() - startTime;
            results.push({
                operation: index.name,
                success: true,
                duration
            });
            console.log(`✅ ${index.name} created successfully (${duration}ms)`);
        }
        catch (error) {
            const duration = Date.now() - startTime;
            results.push({
                operation: index.name,
                success: false,
                duration,
                error: error.message
            });
            console.log(`❌ Failed to create ${index.name}: ${error.message}`);
        }
    }
    return results;
}
async function optimizeTableSettings(dataSource) {
    const results = [];
    const optimizations = [
        {
            name: 'vacuum_analyze_all',
            sql: 'VACUUM ANALYZE;',
            description: 'Vacuum and analyze all tables'
        },
        {
            name: 'update_table_statistics',
            sql: 'ANALYZE;',
            description: 'Update table statistics for query planner'
        },
        {
            name: 'set_random_page_cost',
            sql: 'ALTER SYSTEM SET random_page_cost = 1.1;',
            description: 'Optimize for SSD storage'
        },
        {
            name: 'set_effective_cache_size',
            sql: 'ALTER SYSTEM SET effective_cache_size = \'256MB\';',
            description: 'Set effective cache size'
        },
        {
            name: 'set_shared_buffers',
            sql: 'ALTER SYSTEM SET shared_buffers = \'128MB\';',
            description: 'Optimize shared buffers'
        },
        {
            name: 'set_work_mem',
            sql: 'ALTER SYSTEM SET work_mem = \'8MB\';',
            description: 'Optimize work memory'
        }
    ];
    console.log(`\n⚙️  Applying ${optimizations.length} database optimizations...\n`);
    for (const opt of optimizations) {
        const startTime = Date.now();
        try {
            console.log(`Applying ${opt.name}: ${opt.description}`);
            await dataSource.query(opt.sql);
            const duration = Date.now() - startTime;
            results.push({
                operation: opt.name,
                success: true,
                duration
            });
            console.log(`✅ ${opt.name} applied successfully (${duration}ms)`);
        }
        catch (error) {
            const duration = Date.now() - startTime;
            results.push({
                operation: opt.name,
                success: false,
                duration,
                error: error.message
            });
            console.log(`❌ Failed to apply ${opt.name}: ${error.message}`);
        }
    }
    return results;
}
async function createPerformanceViews(dataSource) {
    const results = [];
    const views = [
        {
            name: 'provider_performance_view',
            sql: `
        CREATE OR REPLACE VIEW provider_performance AS
        SELECT 
          p.id,
          p.business_name,
          p.average_rating,
          COUNT(DISTINCT b.id) as total_bookings,
          COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
          AVG(CASE WHEN b.status = 'completed' THEN b.total_amount END) as avg_booking_value,
          COUNT(DISTINCT r.id) as total_reviews,
          AVG(r.rating) as review_average
        FROM service_providers p
        LEFT JOIN bookings b ON p.user_id = b.provider_id
        LEFT JOIN reviews r ON p.user_id = r.provider_id
        WHERE p.is_active = true
        GROUP BY p.id, p.business_name, p.average_rating;
      `,
            description: 'Create provider performance analytics view'
        },
        {
            name: 'booking_analytics_view',
            sql: `
        CREATE OR REPLACE VIEW booking_analytics AS
        SELECT 
          DATE_TRUNC('day', created_at) as booking_date,
          status,
          COUNT(*) as booking_count,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as avg_booking_value,
          SUM(platform_fee) as platform_revenue
        FROM bookings
        GROUP BY DATE_TRUNC('day', created_at), status
        ORDER BY booking_date DESC;
      `,
            description: 'Create booking analytics view'
        },
        {
            name: 'service_popularity_view',
            sql: `
        CREATE OR REPLACE VIEW service_popularity AS
        SELECT 
          s.id,
          s.name,
          sc.name as category_name,
          COUNT(DISTINCT b.id) as booking_count,
          AVG(r.rating) as avg_rating,
          COUNT(DISTINCT r.id) as review_count,
          s.price,
          ROW_NUMBER() OVER (PARTITION BY s.category_id ORDER BY COUNT(DISTINCT b.id) DESC) as category_rank
        FROM services s
        LEFT JOIN service_categories sc ON s.category_id = sc.id
        LEFT JOIN bookings b ON s.id = b.service_id
        LEFT JOIN reviews r ON s.provider_id = r.provider_id
        WHERE s.is_active = true
        GROUP BY s.id, s.name, sc.name, s.price, s.category_id
        ORDER BY booking_count DESC;
      `,
            description: 'Create service popularity analytics view'
        }
    ];
    console.log(`\n📊 Creating ${views.length} performance views...\n`);
    for (const view of views) {
        const startTime = Date.now();
        try {
            console.log(`Creating ${view.name}: ${view.description}`);
            await dataSource.query(view.sql);
            const duration = Date.now() - startTime;
            results.push({
                operation: view.name,
                success: true,
                duration
            });
            console.log(`✅ ${view.name} created successfully (${duration}ms)`);
        }
        catch (error) {
            const duration = Date.now() - startTime;
            results.push({
                operation: view.name,
                success: false,
                duration,
                error: error.message
            });
            console.log(`❌ Failed to create ${view.name}: ${error.message}`);
        }
    }
    return results;
}
async function analyzePerformance(dataSource) {
    console.log('\n📈 Database Performance Analysis:\n');
    try {
        const tableSizes = await dataSource.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `);
        console.log('📋 Table Sizes:');
        tableSizes.forEach(table => {
            console.log(`  ${table.tablename}: ${table.size}`);
        });
        const indexUsage = await dataSource.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan as scans,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes 
      ORDER BY idx_scan DESC 
      LIMIT 10;
    `);
        console.log('\n🔍 Top Index Usage:');
        indexUsage.forEach(idx => {
            console.log(`  ${idx.indexname} (${idx.tablename}): ${idx.scans} scans, ${idx.size}`);
        });
        const slowQueries = await dataSource.query(`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows
      FROM pg_stat_statements 
      ORDER BY mean_time DESC 
      LIMIT 5;
    `).catch(() => {
            console.log('\n⚠️  pg_stat_statements extension not available for slow query analysis');
            return [];
        });
        if (slowQueries.length > 0) {
            console.log('\n🐌 Slowest Queries:');
            slowQueries.forEach((query, index) => {
                console.log(`  ${index + 1}. Mean time: ${query.mean_time.toFixed(2)}ms, Calls: ${query.calls}`);
                console.log(`     ${query.query.substring(0, 100)}...`);
            });
        }
    }
    catch (error) {
        console.log(`❌ Performance analysis failed: ${error.message}`);
    }
}
async function main() {
    console.log('🎯 Care Services Database Optimization Tool\n');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const dataSource = new typeorm_1.DataSource({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    try {
        await dataSource.initialize();
        console.log('✅ Database connection established\n');
        const indexResults = await createOptimalIndexes(dataSource);
        const optimizationResults = await optimizeTableSettings(dataSource);
        const viewResults = await createPerformanceViews(dataSource);
        await analyzePerformance(dataSource);
        const totalOperations = indexResults.length + optimizationResults.length + viewResults.length;
        const successfulOperations = [
            ...indexResults,
            ...optimizationResults,
            ...viewResults
        ].filter(r => r.success).length;
        console.log('\n📊 Optimization Summary:');
        console.log(`  Total operations: ${totalOperations}`);
        console.log(`  Successful: ${successfulOperations}`);
        console.log(`  Failed: ${totalOperations - successfulOperations}`);
        const totalDuration = [...indexResults, ...optimizationResults, ...viewResults]
            .reduce((sum, r) => sum + r.duration, 0);
        console.log(`  Total duration: ${totalDuration}ms`);
        if (successfulOperations === totalOperations) {
            console.log('\n🎉 Database optimization completed successfully!');
        }
        else {
            console.log('\n⚠️  Database optimization completed with some errors. Check the logs above.');
        }
    }
    catch (error) {
        console.error('❌ Database optimization failed:', error);
        process.exit(1);
    }
    finally {
        await dataSource.destroy();
        process.exit(0);
    }
}
if (require.main === module) {
    main().catch(console.error);
}
//# sourceMappingURL=optimize-database.js.map