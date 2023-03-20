import EntityRepository from '#structures/EntityRepository';
import type { Participant } from '#structures/entities/Participant';
import type { Snowflake } from 'discord.js';

export default class ParticipantRepository extends EntityRepository<Participant> {
    public async getById(guildId: Snowflake, subscriberId: Snowflake, userId: Snowflake): Promise<Participant | null> {
        const entity = await this.findOne({ guildId, subscriberId, userId });

        return entity ?? null;
    }

    public getSubscriberList(guildId: Snowflake, subscriberId: Snowflake): Promise<Participant[]> {
        return this.find({ guildId, subscriberId });
    }

    public getSubscriberIds(): Promise<Participant[]> {
        return this.findAll({ fields: ['guildId', 'subscriberId'] });
    }
}
