import type { Message } from 'discord.js';
import type Listener from '../Listener';
import EmbedBuilder from '#structures/EmbedBuilder';

export default class MessageCreate implements Listener {
    public async run(message: Message): Promise<void> {
        const pinged = message.mentions.users.has(message.client.user.id);

        if (message.guildId !== process.env.TEST_GUILD || !pinged) {
            return;
        }

        const embed = new EmbedBuilder().setTitle('Pinged');

        await message.reply({
            embeds: [embed.setDescription(`Hello there! It's me, a bot! If you want me to do something for you, you must use my slash commands! Type a slash (/) in the message bar to get a list of them!`)],
        });
    }
}
