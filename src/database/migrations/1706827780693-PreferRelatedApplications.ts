import { MigrationInterface, QueryRunner } from 'typeorm';

export class PreferRelatedApplications1706827780693
  implements MigrationInterface
{
  name = 'PreferRelatedApplications1706827780693';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_config" ADD "preferRelatedApplications" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_config" ADD "playAppUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_config" ADD "playAppId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_config" ADD "itunesUrl" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "app_config" DROP COLUMN "itunesUrl"`);
    await queryRunner.query(`ALTER TABLE "app_config" DROP COLUMN "playAppId"`);
    await queryRunner.query(
      `ALTER TABLE "app_config" DROP COLUMN "playAppUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_config" DROP COLUMN "preferRelatedApplications"`,
    );
  }
}
