import type { GuildMember } from 'discord.js';
import ParticipantManager from '#structures/manager/ParticipantManager';

export default class GuildMemberRemove {
    public async run(member: GuildMember): Promise<void> {
        await new ParticipantManager().removeSubscriber(member.guild, member.id);
        await new ParticipantManager().removeParticipant(member.guild, member.id);
    }
}
