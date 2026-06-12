"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
var typeorm_1 = require("typeorm");
var dotenv = require("dotenv");
var path = require("path");
// Load environmental configuration
dotenv.config({ path: path.join(__dirname, '../../../.env') });
var dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.warn('WARNING: DATABASE_URL is not defined in the environment. TypeORM CLI commands may fail.');
}
exports.AppDataSource = new typeorm_1.DataSource({
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
