import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environmental configuration
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.warn('WARNING: DATABASE_URL is not defined in the environment. TypeORM CLI commands may fail.');
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: dbUrl,
  entities: [
    path.join(__dirname, '/entities/*.entity{.ts,.js}'),
    path.join(__dirname, '/entities/*{.ts,.js}'),
  ],
  migrations: [
    path.join(__dirname, '/../../migrations/*{.ts,.js}'),
  ],
  synchronize: false,
  logging: true,
  ssl: dbUrl ? { rejectUnauthorized: false } : undefined,
});
