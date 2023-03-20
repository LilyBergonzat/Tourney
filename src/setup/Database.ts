import { Logger } from '@lilywonhalf/pretty-logger';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { MikroORM } from '@mikro-orm/core';
import type { EntityManager, MySqlDriver } from '@mikro-orm/mysql';

export default class Database {
    private static instance: Database;

    private _initialized = false;
    private _orm!: MikroORM<MySqlDriver>;

    public constructor() {
        if (Database.instance) {
            return Database.instance;
        }

        Database.instance = this;
    }

    public async initialize(): Promise<void> {
        this._orm = await MikroORM.init<MySqlDriver>({
            metadataProvider: TsMorphMetadataProvider,
            entities: ['./dist/structures/entities'],
            entitiesTs: ['./src/structures/entities'],
            logger: (message: string) => {
                // Let's not print the query that's executed every single minute
                if (message.includes('subtime(now(), concat(cc.decay_hours, \':00:00\'))')) {
                    return;
                }

                Logger.info(message)
            },
            debug: true,
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
                path: './dist/migrations',
                pathTs: './src/migrations',
            },
        });

        this._initialized = true;
    }

    public get initialized(): boolean {
        return this._initialized;
    }

    public get orm(): MikroORM<MySqlDriver> {
        if (!this.initialized) {
            throw new Error('Connection to database not initialized');
        }

        return this._orm;
    }

    public get em(): EntityManager {
        return this._orm.em!.fork();
    }
}
