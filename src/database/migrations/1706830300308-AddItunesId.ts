import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddItunesId1706830300308 implements MigrationInterface {
  name = 'AddItunesId1706830300308';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_config" ADD "itunesId" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_config" DROP COLUMN "itunesId"`);
  }
}
