import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import Command from '#structures/Command';
import InteractionUtil from '#util/InteractionUtil';

export default class SetAvatarCommand extends Command {
    public constructor() {
        super(
            new SlashCommandBuilder()
                .setName('setavatar')
                .setDefaultMemberPermissions(0)
                .setDescription('Allows you to change my avatar')
                .addStringOption(builder => builder
                    .setName('url')
                    .setDescription('The URL of the avatar you would like me to change to.')
                    .setRequired(true)
                )
        );
    }

    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        interaction.client.user!.setAvatar(interaction.options.getString('url', true)).then(() => {
            InteractionUtil.reply(interaction, {
                title: 'I look great!',
                description: 'My profile picture has been successfully changed!',
            });
        });
    }
}
