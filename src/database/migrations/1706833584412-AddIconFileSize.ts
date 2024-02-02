import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIconFileSize1706833584412 implements MigrationInterface {
  name = 'AddIconFileSize1706833584412';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_config" ADD "iconFileSize" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_config" DROP COLUMN "iconFileSize"`,
    );
  }
}
