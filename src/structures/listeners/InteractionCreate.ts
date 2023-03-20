import type { Interaction, ChatInputCommandInteraction, ContextMenuCommandInteraction } from 'discord.js';
import type Listener from '../Listener';
import CommandRepository from '#structures/repositories/CommandRepository';
import Logger from '@lilywonhalf/pretty-logger';

export default class InteractionCreate implements Listener {
    private commandRepository: CommandRepository;

    public constructor() {
        this.commandRepository = new CommandRepository();
    }

    public run(interaction: Interaction): void {
        if (!interaction.guildId) {
            if (interaction.isRepliable()) {
                interaction.reply('This bot can only be used in servers, not in DMs.');
            }

            return;
        }

        if (interaction.isChatInputCommand()) {
            this.commandInteractionHandler(interaction).catch(Logger.exception);
        } else if (interaction.isContextMenuCommand()) {
            this.contextMenuInteractionHandler(interaction).catch(Logger.exception);
        }
    }

    private async commandInteractionHandler(interaction: ChatInputCommandInteraction): Promise<void> {
        const commandList = await this.commandRepository.getList();
        const commandClass = commandList.get(interaction.commandName.toLowerCase());

        if (!commandClass) {
            return;
        }

        const commandInstance = new commandClass();

        await commandInstance.run(interaction);
    }

    private async contextMenuInteractionHandler(interaction: ContextMenuCommandInteraction): Promise<void> {
        const commandList = await this.commandRepository.getList();
        const commandClass = commandList.get(interaction.commandName.toLowerCase());

        if (!commandClass) {
            return;
        }

        const commandInstance = new commandClass();

        if (!commandInstance.contextMenuRun) {
            return;
        }

        await commandInstance.contextMenuRun(interaction);
    }
}
