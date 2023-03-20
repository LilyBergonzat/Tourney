import type { Snowflake } from 'discord.js';
import EntityRepository from '#structures/EntityRepository';
import type { Settings, SettingField } from '#structures/entities/Settings';

export default class SettingsRepository extends EntityRepository<Settings> {
    public async getGuildSetting(guild: Snowflake, key: SettingField): Promise<string | null> {
        // Cache set to 30 minutes
        const setting = await this.findOne(
            { guild, key },
            { cache: [`setting_${guild}_${key}`, 30 * 60 * 1000] }
        );

        if (setting) {
            return String(setting.value);
        } else {
            return null;
        }
    }
}
