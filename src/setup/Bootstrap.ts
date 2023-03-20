import { Client, IntentsBitField, Partials, Routes } from 'discord.js';
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord.js';
import { REST } from '@discordjs/rest';
import { config as configureEnvironment } from 'dotenv';
import Logger from '@lilywonhalf/pretty-logger';
import FileSystemUtil from '#root/util/FileSystemUtil';
import Ready from '#structures/listeners/Ready';
import CommandRepository from '#structures/repositories/CommandRepository';
import Database from '#root/setup/Database';

type BootstrapOptions = {
    dotEnvPath?: string;
};

export class Bootstrap {
    private static instance: Bootstrap;

    public client!: Client;

    private intents: number[] = [];

    public constructor({ dotEnvPath }: BootstrapOptions = {}) {
        if (Bootstrap.instance) {
            return Bootstrap.instance;
        }

        if (dotEnvPath) {
            configureEnvironment({ path: dotEnvPath });
        } else {
            configureEnvironment();
        }

        Bootstrap.instance = this;
    }

    public initializeIntents(): void {
        this.intents = [
            IntentsBitField.Flags.Guilds,
            IntentsBitField.Flags.GuildMembers,
            IntentsBitField.Flags.GuildBans,
            IntentsBitField.Flags.GuildEmojisAndStickers,
            IntentsBitField.Flags.GuildIntegrations,
            IntentsBitField.Flags.GuildInvites,
            IntentsBitField.Flags.GuildVoiceStates,
            IntentsBitField.Flags.GuildPresences,
            IntentsBitField.Flags.GuildMessages,
            IntentsBitField.Flags.GuildMessageReactions,
            IntentsBitField.Flags.DirectMessages,
            IntentsBitField.Flags.DirectMessageReactions,
            IntentsBitField.Flags.MessageContent,
            IntentsBitField.Flags.GuildScheduledEvents,
            IntentsBitField.Flags.AutoModerationConfiguration,
            IntentsBitField.Flags.AutoModerationExecution,
        ];
    }

    public initializeClient(): void {
        this.client = new Client({
            intents: this.intents,
            partials: [
                Partials.User,
                Partials.Channel,
                Partials.GuildMember,
                Partials.Message,
                Partials.Reaction,
                Partials.GuildScheduledEvent,
                Partials.ThreadMember,
            ],
        });
    }

    public async login(): Promise<Client> {
        return new Promise((resolve, reject) => {
            this.client.once('ready', async (client: Client) => {
                const database = new Database();

                await database.initialize();
                await this.declareApplicationCommands(client);
                await this.attachListeners(client);
                await this.startLoops(client);

                new Ready().run(client);

                resolve(client);
            });

            this.client.login(process.env.TOKEN!).catch(reject);
        });
    }

    private async declareApplicationCommands(client: Client) {
        const commandRepository = new CommandRepository();

        await commandRepository.initialize();

        const rest = new REST({ version: '10' }).setToken(process.env.TOKEN!);
        const testGuildId: string = process.env.TEST_GUILD!;
        const commands: Array<RESTPostAPIApplicationCommandsJSONBody> = [];

        [...(await commandRepository.getList()).values()].forEach(commandClass => {
            const command = new commandClass();

            commands.push(command.slashCommandBuilder.toJSON());

            if (command.contextMenuCommandBuilder) {
                commands.push(command.contextMenuCommandBuilder.toJSON());
            }
        });

        rest.put(Routes.applicationGuildCommands(client.user!.id, testGuildId), { body: commands })
            .then((data: any) => {
                Logger.info(`${data.length} application commands for testing.`);
            }).catch(console.error);

        rest.put(Routes.applicationCommands(client.user!.id), { body: commands })
            .then((data: any) => {
                Logger.info(`${data.length} application commands for production.`);
            }).catch(console.error);
    }

    private async attachListeners(client: Client) {
        const files = await FileSystemUtil.glob(
            'dist/structures/listeners/**/*.js',
            { absolute: true, nodir: true }
        );

        await Promise.all(files.map(async file => {
            const listenerPath = `${file}`;
            // noinspection JSPotentiallyInvalidConstructorUsage
            const listenerFile = await import(listenerPath);
            const listenerInstance = new listenerFile.default();

            if (listenerInstance !== null) {
                let listenerName = file.slice(
                    file.lastIndexOf('/') + 1,
                    file.lastIndexOf('.')
                );

                listenerName = listenerName.slice(0, 1).toLowerCase() + listenerName.slice(1);

                if (listenerName !== 'ready') {
                    client.on(listenerName, listenerInstance.run.bind(listenerInstance));
                }
            }
        }));
    }

    private async startLoops(client: Client) {
        const files = await FileSystemUtil.glob(
            'dist/structures/loops/**/*.js',
            { absolute: true, nodir: true }
        );

        await Promise.all(files.map(async file => {
            const loopPath = `${file}`;
            // noinspection JSPotentiallyInvalidConstructorUsage
            const loopFile = await import(loopPath);
            const loopInstance = new loopFile.default();

            if (loopInstance !== null) {
                loopInstance.run(client);
            }
        }));
    }
}
