"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const dotenv = require("dotenv");
const path_1 = require("path");
dotenv.config();
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres123',
    database: process.env.DATABASE_NAME || 'care_services_db',
    synchronize: false,
    logging: true,
    entities: [(0, path_1.join)(__dirname, 'src/database/entities/**/*.entity{.ts,.js}')],
    migrations: [(0, path_1.join)(__dirname, 'src/database/migrations/**/*{.ts,.js}')],
    migrationsTableName: 'migrations',
});
exports.default = AppDataSource;
//# sourceMappingURL=typeorm.config.js.map