import Logger from '@lilywonhalf/pretty-logger';
import type { Client } from 'discord.js';
import type Listener from '../Listener';
import ParticipantManager from '#structures/manager/ParticipantManager';

export default class Ready implements Listener {
    public run(client: Client): void {
        const nbGuilds = client.guilds.cache.size;

        Logger.info(`Logged in as ${client.user!.username}#${client.user!.discriminator}`);
        Logger.info(`Serving in ${nbGuilds} guild${nbGuilds > 1 ? 's' : ''}`);

        new ParticipantManager().readyHandler(client).catch(Logger.exception);
    }
}
