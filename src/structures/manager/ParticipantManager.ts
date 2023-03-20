import type ParticipantRepository from '#structures/repositories/ParticipantRepository';
import type SettingsRepository from '#structures/repositories/SettingsRepository';
import Database from '#setup/Database';
import { Participant } from '#structures/entities/Participant';
import { SettingField, Settings } from '#structures/entities/Settings';
import type { Client, Guild, Snowflake } from 'discord.js';
import Logger from '@lilywonhalf/pretty-logger';

export default class ParticipantManager {
    private static instance: ParticipantManager;

    private participantRepository!: ParticipantRepository;
    private settingsRepository!: SettingsRepository;

    constructor() {
        if (ParticipantManager.instance) {
            return ParticipantManager.instance;
        }

        this.participantRepository = new Database().em!.getRepository(Participant);
        this.settingsRepository = new Database().em!.getRepository(Settings);

        ParticipantManager.instance = this;
    }

    public async readyHandler(client: Client): Promise<void> {
        const subscribers = await new Database().em!
            .createQueryBuilder(Participant, 'p')
            .select(['p.guild_id', 'p.subscriber_id'], true)
            .getResultList();

        await Promise.all(subscribers.map(async participant => {
            if (!client.guilds.cache.has(participant.guildId)) {
                Logger.warning(`Left guild ID ${participant.guildId}`);
                await this.removeGuild(participant.guildId);
            }

            const guild = client.guilds.cache.get(participant.guildId)!;
            const member = await guild.members.fetch(participant.subscriberId).catch(() => null);

            if (!member) {
                await this.removeSubscriber(guild, participant.subscriberId);
            }
        }));

        const participants = await new Database().em!
            .createQueryBuilder(Participant, 'p')
            .select(['p.guild_id', 'p.user_id'], true)
            .getResultList();

        await Promise.all(participants.map(async participant => {
            if (!client.guilds.cache.has(participant.guildId)) {
                Logger.warning(`Left guild ID ${participant.guildId}`);
                await this.removeGuild(participant.guildId);
            }

            const guild = client.guilds.cache.get(participant.guildId)!;
            const member = await guild.members.fetch(participant.userId).catch(() => null);

            if (!member) {
                await this.removeParticipant(guild, participant.userId);
            }
        }));
    }

    public async removeGuild(guildId: Snowflake): Promise<void> {
        await this.participantRepository.nativeDelete({
            guildId: guildId,
        });
    }

    public async removeSubscriber(guild: Guild, subscriberId: Snowflake): Promise<void> {
        const subscriber = await guild.members.fetch(subscriberId).catch(() => null);
        const roleId = await this.settingsRepository.getGuildSetting(
            guild.id,
            SettingField.PARTICIPANT_ROLE
        );

        if (!roleId) {
            return;
        }

        if (subscriber) {
            await subscriber.roles.remove(roleId).catch(() => {});
        }

        const participants = await this.participantRepository.getSubscriberList(guild.id, subscriberId);

        if (!participants || participants.length < 1) {
            return;
        }

        await Promise.all(participants.map(async participant => {
            const member = await guild.members.fetch(participant.userId).catch(() => null);

            if (!member) {
                return;
            }

            await member.roles.remove(roleId);
        }));

        await this.participantRepository.nativeDelete({
            guildId: guild.id,
            subscriberId: subscriberId,
        });
    }

    public async removeParticipant(guild: Guild, participantId: Snowflake): Promise<void> {
        const participant = await guild.members.fetch(participantId).catch(() => null);
        const roleId = await this.settingsRepository.getGuildSetting(
            guild.id,
            SettingField.PARTICIPANT_ROLE
        );

        if (roleId && participant) {
            await participant.roles.remove(roleId).catch(() => {});
        }

        await this.participantRepository.nativeDelete({
            guildId: guild.id,
            userId: participantId,
        });
    }
}
