import type { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';
import Logger from '@lilywonhalf/pretty-logger';
import Command from '#structures/Command';
import EmbedBuilder from '#structures/EmbedBuilder';
import Database from '#setup/Database';
import { Participant } from '#structures/entities/Participant';
import type ParticipantRepository from '#structures/repositories/ParticipantRepository';
import InteractionUtil from '#util/InteractionUtil';
import type SettingsRepository from '#structures/repositories/SettingsRepository';
import { SettingField, Settings } from '#structures/entities/Settings';

export default class TourneyCommand extends Command {
    private settingsRepository: SettingsRepository;
    private participantRepository: ParticipantRepository;

    public constructor() {
        super(
            new SlashCommandBuilder()
                .setName('tourney')
                .setDMPermission(false)
                .setDefaultMemberPermissions(0)
                .setDescription('Allows you to invite people to the tournament, delete or list invitations')
                .addSubcommand(subcommand => subcommand
                    .setName('add')
                    .setDescription('Invite someone to the tournament')
                    .addUserOption(option => option
                        .setName('user')
                        .setDescription('The person you want to invite')
                        .setRequired(true)
                    )
                )
                .addSubcommand(subcommand => subcommand
                    .setName('remove')
                    .setDescription('Remove a person you\'ve invited')
                    .addUserOption(option => option
                        .setName('user')
                        .setDescription('The person you want to remove the invitation for')
                        .setRequired(true)
                    ))
                .addSubcommand(subcommand => subcommand
                    .setName('list')
                    .setDescription('List all the invitations you\'ve sent'))
        );

        this.settingsRepository = new Database().em.getRepository(Settings);
        this.participantRepository = new Database().em.getRepository(Participant);
    }

    public async run(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: true });

        if (!await this.settingsRepository.getGuildSetting(interaction.guild!.id, SettingField.PARTICIPANT_ROLE)) {
            await InteractionUtil.reply(interaction, {
                title: 'Tourney',
                description: `This bot has not been yet configured by this server's administrators.`,
            }, true);

            return;
        }

        switch (interaction.options.getSubcommand().toLowerCase()) {
            case 'add':
                await this.runAdd(interaction).catch(Logger.exception);
                break;

            case 'remove':
                await this.runRemove(interaction).catch(Logger.exception);
                break;

            case 'list':
                await this.runList(interaction).catch(Logger.exception);
                break;

            default:
                await interaction.editReply({ embeds: [
                    new EmbedBuilder(true).setTitle(`Tourney`).setDescription(
                        'You executed a subcommand that does not exist. This is not supposed to be possible.'
                    ),
                ] });
        }
    }

    private async runList(interaction: ChatInputCommandInteraction): Promise<void> {
        const list = await this.participantRepository.getSubscriberList(interaction.guildId!, interaction.user.id);

        if (!list || list.length < 1) {
            await InteractionUtil.reply(interaction, {
                title: `Tourney`,
                description: `You did not invite anyone yet.`,
            });

            return;
        }

        const formattedList = (await Promise.all(list.map(async participant => {
            const user = await interaction.client.users.fetch(participant.userId);

            return `${user?.tag ?? 'Unknown user'} (<@${participant.userId}>)`;
        }))).join('\n');

        await InteractionUtil.reply(interaction, {
            title: `Tourney`,
            description: `**Here is a list of the people you invited:**\n\n${formattedList}`,
        });
    }

    private async runAdd(interaction: ChatInputCommandInteraction): Promise<void> {
        const { em } = new Database();
        const user = interaction.options.getUser('user', true);
        const list = await this.participantRepository.getSubscriberList(interaction.guildId!, interaction.user.id);

        if (user.bot || user.system) {
            await InteractionUtil.reply(interaction, {
                title: `Tourney`,
                description: `You cannot invite a bot.`,
            }, true);

            return;
        }

        if (user.id === interaction.user.id) {
            await InteractionUtil.reply(interaction, {
                title: `Tourney`,
                description: `You cannot invite yourself.`,
            }, true);

            return;
        }

        if (list && list.length > 4) {
            await InteractionUtil.reply(interaction, {
                title: `Tourney`,
                description: `You already invited the maximum number of 5 people.`,
            }, true);

            return;
        }

        const member = await interaction.guild!.members.fetch(user.id).catch(() => null);

        if (!member) {
            await InteractionUtil.reply(interaction, {
                title: `Tourney`,
                description: `The person you are trying to invite does not seem to be on this server.`,
            }, true);

            return;
        }

        const roleId = await this.settingsRepository.getGuildSetting(
            interaction.guild!.id,
            SettingField.PARTICIPANT_ROLE
        );

        if (!member.roles.cache.has(roleId!)) {
            await member.roles.add(roleId!);
        }

        await em.upsert(
            Participant,
            { guildId: interaction.guildId, subscriberId: interaction.user.id, userId: user.id }
        );

        await InteractionUtil.reply(interaction, {
            title: `Tourney`,
            description: `Participant added!`,
        });
    }

    private async runRemove(interaction: ChatInputCommandInteraction): Promise<void> {
        const user = interaction.options.getUser('user', true);
        const participant = await this.participantRepository.getById(
            interaction.guildId!,
            interaction.user.id,
            user.id
        );
        const member = await interaction.guild!.members.fetch(user.id).catch(() => null);
        const roleId = await this.settingsRepository.getGuildSetting(
            interaction.guild!.id,
            SettingField.PARTICIPANT_ROLE
        );

        if (!participant) {
            await InteractionUtil.reply(interaction, {
                title: `Tourney`,
                description: `The user you entered does not have an invitation.`,
            }, true);

            return;
        }

        await this.participantRepository.removeAndFlush(participant);

        const invites = await this.participantRepository.count({ guildId: interaction.guildId, userId: user.id });

        if (member && member.roles.cache.has(roleId!) && invites < 1) {
            await member.roles.remove(roleId!);
        }

        await InteractionUtil.reply(interaction, {
            title: `Tourney`,
            description: 'Invitation removed.',
        });
    }
}
