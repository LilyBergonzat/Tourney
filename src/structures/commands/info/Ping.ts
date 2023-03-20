import type { ChatInputCommandInteraction } from 'discord.js';
import Command from '#structures/Command';
import { SlashCommandBuilder } from 'discord.js';
import Logger from '@lilywonhalf/pretty-logger';

export default class PingCommand extends Command {
    public constructor() {
        super(
            new SlashCommandBuilder()
                .setName('ping')
                .setDescription('Tests the latency')
        );
    }

    public async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const response = await interaction.reply({ content: 'Ping...', fetchReply: true });
        const latency = response.createdTimestamp - interaction.createdTimestamp;

        await interaction.editReply(`Pong! Took me ${latency}ms.`).catch(Logger.error);
    }
}
