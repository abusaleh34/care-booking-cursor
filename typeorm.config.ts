import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres123',
  database: process.env.DATABASE_NAME || 'care_services_db',
  synchronize: false,
  logging: true,
  entities: [join(__dirname, 'src/database/entities/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'src/database/migrations/**/*{.ts,.js}')],
  migrationsTableName: 'migrations',
});

export default AppDataSource;