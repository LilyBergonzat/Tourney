import { Collection } from 'discord.js';
import type Command from '#structures/Command';
import FileSystemUtil from '#root/util/FileSystemUtil';
import type Repository from '#structures/Repository';

type EndCommand = new () => Command;

export default class CommandRepository implements Repository<EndCommand> {
    private static instance: CommandRepository;

    private readonly _list!: Collection<string, EndCommand>;
    private _initialized = false;

    public constructor() {
        if (CommandRepository.instance) {
            return CommandRepository.instance;
        }

        this._list = new Collection<string, EndCommand>();
        CommandRepository.instance = this;
    }

    public get initialized() {
        return this._initialized;
    }

    public async getList(): Promise<Collection<string, EndCommand>> {
        if (!this.initialized) {
            throw new Error('The command list has not been initialized.');
        }

        return this._list;
    }

    public async initialize() {
        if (this.initialized) {
            return;
        }

        const files = await FileSystemUtil.glob(
            'dist/structures/commands/**/*.js',
            { absolute: true, nodir: true }
        );

        await Promise.all(files.map(async file => {
            const commandPath = `${file}`;
            const commandClass = (await import(commandPath)).default;

            if (commandClass !== null) {
                const commandName = file.slice(
                    file.lastIndexOf('/') + 1, file.lastIndexOf('.')
                ).toLowerCase();

                this._list.set(commandName, commandClass);
            }
        }));

        this._initialized = true;
    }
}
