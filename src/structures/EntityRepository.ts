import type { Collection } from 'discord.js';
import { EntityRepository as MikroORMEntityRepository } from '@mikro-orm/mysql';
import type { SqlEntityManager } from '@mikro-orm/knex/SqlEntityManager';
import type { EntityName } from '@mikro-orm/core';
import type Repository from '#structures/Repository';

// eslint-disable-next-line @typescript-eslint/ban-types
export default class EntityRepository<T extends {}>
    extends MikroORMEntityRepository<T>
    implements Repository<T>
{
    constructor(_em: SqlEntityManager, entityName: EntityName<T>) {
        super(_em, entityName);
    }

    async getList(): Promise<Collection<string | number, T> | Array<T>> {
        const list = await this.findAll();

        return [...list.values()];
    }
}
