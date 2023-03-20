import { Entity, PrimaryKey, PrimaryKeyType } from '@mikro-orm/core';
import ParticipantRepository from '#structures/repositories/ParticipantRepository';

@Entity({ customRepository: () => ParticipantRepository })
export class Participant {
    @PrimaryKey({ comment: 'The id of the guild' })
    guildId!: string;

    @PrimaryKey({ comment: 'The id of the member who subscribed to give the tourney role' })
    subscriberId!: string;

    @PrimaryKey({ comment: 'The id of the user who received the tourney role' })
    userId!: string;

    [PrimaryKeyType]?: [string, string, string];
}
