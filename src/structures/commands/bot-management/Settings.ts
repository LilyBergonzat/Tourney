import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { wrap } from '@mikro-orm/core';
import Logger from '@lilywonhalf/pretty-logger';
import Command from '#structures/Command';
import Database from '#root/setup/Database';
import { SettingField, Settings } from '#structures/entities/Settings';
import type SettingsRepository from '#structures/repositories/SettingsRepository';
import InteractionUtil from '#util/InteractionUtil';

const TITLE_MAP: Record<SettingField, string> = {
    [SettingField.PARTICIPANT_ROLE]: 'Participant role',
};

const CHOICE_MAP: Record<string, SettingField> = {
    'participant-role': SettingField.PARTICIPANT_ROLE,
};

export default class SettingsCommand extends Command {
    private settingsRepository: SettingsRepository;

    public constructor() {
        super(
            new SlashCommandBuilder()
                .setName('settings')
                .setDMPermission(false)
                .setDefaultMemberPermissions(0)
                .setDescription('Allows you to view and edit settings')
                .addSubcommand(subcommand => subcommand
                    .setName('view')
                    .setDescription('Check a setting value')
                    .addStringOption(option => option
                        .setName('key')
                        .setDescription('The setting key you want to check the value of')
                        .setChoices({ name: 'participant-role', value: SettingField.PARTICIPANT_ROLE })
                        .setRequired(true)
                    ))
                .addSubcommand(subcommand => subcommand
                    .setName('edit')
                    .setDescription('Edit a setting value')
                    .addRoleOption(roleOption => roleOption
                        .setName('participant-role')
                        .setDescription('The role that invited tournament participants will receive through the command')
                    )
                )
                .addSubcommand(subcommand => subcommand
                    .setName('delete')
                    .setDescription('Delete a setting value')
                    .addStringOption(option => option
                        .setName('key')
                        .setDescription('The setting key you want to delete the value of')
                        .setChoices({ name: 'participant-role', value: SettingField.PARTICIPANT_ROLE })
                        .setRequired(true)
                    ))
        );

        this.settingsRepository = new Database().em.getRepository(Settings);
    }

    public async run(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: true });

        switch (interaction.options.getSubcommand().toLowerCase()) {
            case 'view':
                await this.runView(interaction).catch(Logger.exception);
                break;

            case 'edit':
                await this.runEdit(interaction).catch(Logger.exception);
                break;

            case 'delete':
                await this.runDelete(interaction).catch(Logger.exception);
                break;
        }
    }

    private async runView(interaction: ChatInputCommandInteraction): Promise<void> {
        const key = interaction.options.getString('key')! as SettingField;
        const setting = await this.settingsRepository.getGuildSetting(interaction.guildId!, key);

        await InteractionUtil.reply(interaction, {
            title: TITLE_MAP[key],
            description: setting ?? 'Not defined',
        });
    }

    private async runDelete(interaction: ChatInputCommandInteraction): Promise<void> {
        const key = interaction.options.getString('key')! as SettingField;
        const setting: Settings | null = await this.settingsRepository.findOne({ key, guild: interaction.guildId });

        if (!setting) {
            await InteractionUtil.reply(interaction, {
                title: TITLE_MAP[key],
                description: 'This setting already has no value.',
            }, true);

            return;
        }

        await this.settingsRepository.removeAndFlush(setting);

        await InteractionUtil.reply(interaction, {
            title: TITLE_MAP[key],
            description: `The value for the setting ${key} has been deleted.`,
        });
    }

    private async runEdit(interaction: ChatInputCommandInteraction): Promise<void> {
        for (const element of Object.keys(CHOICE_MAP)) {
            const key = CHOICE_MAP[element];
            const guild = interaction.guildId!;

            if (!interaction.options.get(element)) {
                continue;
            }

            const value = String(interaction.options.get(element)?.value);
            let setting = await this.settingsRepository.findOne({ guild, key });

            if (!setting) {
                setting = new Settings();

                setting.key = key;
                setting.guild = guild;

                wrap(setting);
            }

            setting.value = value;
            await this.settingsRepository.persist(setting).flush();
            await new Database().em.clearCache(`setting_${guild}_${key}`);
        }

        await InteractionUtil.reply(interaction, {
            title: 'Settings',
            description: 'The settings have been updated successfully!',
        });
    }
}
