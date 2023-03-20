import { Entity, PrimaryKey, PrimaryKeyType, Property, types } from '@mikro-orm/core';
import SettingsRepository from '#structures/repositories/SettingsRepository';

export enum SettingField {
    PARTICIPANT_ROLE = 'participant_role'
}

@Entity({ customRepository: () => SettingsRepository })
export class Settings {
    @PrimaryKey({ comment: 'The key of the setting, snake case' })
    key!: string;

    @PrimaryKey({ comment: 'The guild snowflake in which this setting applies' })
    guild!: string;

    @Property({ type: types.text, comment: 'The value of the setting' })
    value!: string;

    [PrimaryKeyType]?: [string, string];
}
