"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const config_1 = require("@nestjs/config");
const dotenv_1 = require("dotenv");
const customer_data_seeder_1 = require("../src/database/seeders/customer-data.seeder");
(0, dotenv_1.config)();
const configService = new config_1.ConfigService();
const dataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: configService.get('DATABASE_HOST') || 'localhost',
    port: configService.get('DATABASE_PORT') || 5432,
    username: configService.get('DATABASE_USERNAME') || 'postgres',
    password: configService.get('DATABASE_PASSWORD') || 'postgres',
    database: configService.get('DATABASE_NAME') || 'care_services',
    entities: ['src/database/entities/*.entity.ts'],
    synchronize: false,
    logging: true,
});
async function runSeeder() {
    try {
        console.log('🔗 Connecting to database...');
        await dataSource.initialize();
        console.log('✅ Database connected');
        await (0, customer_data_seeder_1.seedCustomerData)(dataSource);
        console.log('🎉 Seeding completed successfully');
    }
    catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
    finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
            console.log('📕 Database connection closed');
        }
    }
}
runSeeder();
//# sourceMappingURL=seed-customer-data.js.map