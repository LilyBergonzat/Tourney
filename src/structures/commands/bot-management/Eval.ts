import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Logger from '@lilywonhalf/pretty-logger';
import Command from '#structures/Command';
import InteractionUtil from '#util/InteractionUtil';

export default class EvalCommand extends Command {
    public constructor() {
        super(
            new SlashCommandBuilder()
                .setName('eval')
                .setDefaultMemberPermissions(0)
                .setDescription('Allows you to execute nodejs code and display the return value')
                .addStringOption(builder => builder
                    .setName('code')
                    .setDescription('The nodejs code you want to execute')
                    .setRequired(true)
                )
        );
    }

    public async run(interaction: ChatInputCommandInteraction): Promise<void> {
        if (interaction.user.id !== process.env.OWNER) {
            await InteractionUtil.reply(
                interaction,
                { title: 'Unauthorized', description: 'You do not have the right to execute this command.' },
                true
            );

            return;
        }

        let description;
        let title = '✅ Code executed';
        const fields = [{
            name: 'Executed code',
            value: `\`\`\`js\n${interaction.options.getString('code')}\`\`\``,
        }];
        let error = false;

        try {
            description = eval(interaction.options.getString('code', true));
        } catch (exception) {
            Logger.exception(exception as Error);
            description = (exception as Error).message;
            title = '❌ Code crashed';
            error = true;
        }

        if (!description || description.toString().trim().length < 1) {
            description = '<empty>';
        }

        fields.push({ name: 'Result', value: description.toString() });

        await InteractionUtil.reply(interaction, { title, description, fields }, error);
    }
}
