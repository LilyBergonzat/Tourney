import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { config as configureEnvironment } from 'dotenv';

configureEnvironment({ path: '../.env' });

export default {
    metadataProvider: TsMorphMetadataProvider,
    entities: ['../dist/structures/entities'],
    entitiesTs: ['../src/structures/entities'],
    type: 'mysql',
    timezone: '+00:00',
    dbName: process.env.DBNAME,
    user: process.env.DBUSER,
    host: process.env.DBHOST,
    password: process.env.DBPASSWORD,
    port: Number(process.env.DBPORT),
    driverOptions: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_0900_ai_ci',
    },
    migrations: {
        path: '../dist/migrations',
        pathTs: '../src/migrations',
    },
}
