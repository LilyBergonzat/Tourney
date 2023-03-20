import { Migration } from '@mikro-orm/migrations';

export class Migration20230320142507 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table `participant` (`guild_id` varchar(255) not null comment \'The id of the guild\', `subscriber_id` varchar(255) not null comment \'The id of the member who subscribed to give the tourney role\', `user_id` varchar(255) not null comment \'The id of the user who received the tourney role\', primary key (`guild_id`, `subscriber_id`, `user_id`)) default character set utf8mb4 engine = InnoDB;');

    this.addSql('create table `settings` (`key` varchar(255) not null comment \'The key of the setting, snake case\', `guild` varchar(255) not null comment \'The guild snowflake in which this setting applies\', `value` text not null comment \'The value of the setting\', primary key (`key`, `guild`)) default character set utf8mb4 engine = InnoDB;');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists `participant`;');

    this.addSql('drop table if exists `settings`;');
  }

}
