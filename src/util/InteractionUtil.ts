import type {
    Interaction,
    RepliableInteraction,
    SelectMenuInteraction,
    MessageComponentInteraction,
    CommandInteraction,
    ContextMenuCommandInteraction,
    InteractionResponse,
    Message,
    APIEmbed,
    EmbedData
} from 'discord.js';
import EmbedBuilder from '#structures/EmbedBuilder';

export default class InteractionUtil {
    public static reply(
        interaction: RepliableInteraction,
        embedData: EmbedData | APIEmbed,
        error = false,
        ephemeral = true
    ): Promise<InteractionResponse | Message> {
        const options = { embeds: [new EmbedBuilder(error, embedData)] };

        return interaction.replied || interaction.deferred
            ? interaction.editReply(options)
            : interaction.reply({ ...options, ephemeral });
    }

    public static formatInteractionForLog(interaction: Interaction): any {
        const commandInteraction = interaction as CommandInteraction;
        const selectMenuInteraction = interaction as SelectMenuInteraction;
        const messageComponentInteraction = interaction as MessageComponentInteraction;
        const contextMenuCommandInteraction = interaction as ContextMenuCommandInteraction;

        return {
            type: interaction.type,
            user: {
                id: interaction.user.id,
                tag: interaction.user.tag,
            },
            name: commandInteraction.commandName ?? messageComponentInteraction.customId,
            options: commandInteraction.options?.data
                ?? selectMenuInteraction.values
                ?? contextMenuCommandInteraction.targetId
                ?? null,
        };
    }
}
