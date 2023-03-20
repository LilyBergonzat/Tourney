import type {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
    SlashCommandSubcommandsOnlyBuilder,
    ContextMenuCommandBuilder,
    ContextMenuCommandInteraction
} from 'discord.js';

export type SlashCommandData = SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
export type MultipleInteractionCommand = ChatInputCommandInteraction | ContextMenuCommandInteraction;

export default abstract class Command {
    private readonly _slashCommandBuilder: SlashCommandData;
    private readonly _contextMenuCommandBuilder?: ContextMenuCommandBuilder;

    public constructor(slashCommandBuilder: SlashCommandData, contextMenuCommandBuilder?: ContextMenuCommandBuilder) {
        this._slashCommandBuilder = slashCommandBuilder;
        this._contextMenuCommandBuilder = contextMenuCommandBuilder;
    }

    public get slashCommandBuilder() {
        return this._slashCommandBuilder;
    }

    public get contextMenuCommandBuilder() {
        return this._contextMenuCommandBuilder;
    }

    public abstract run(interaction: ChatInputCommandInteraction): Promise<void | boolean>;

    public contextMenuRun?(interaction: ContextMenuCommandInteraction): Promise<void | boolean>;
}
