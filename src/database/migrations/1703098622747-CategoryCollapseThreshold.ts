import { MigrationInterface, QueryRunner } from 'typeorm';

export class CategoryCollapseThreshold1703098622747
  implements MigrationInterface
{
  name = 'CategoryCollapseThreshold1703098622747';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_config" ADD "categoryCollapseThreshold" integer DEFAULT '7'`,
    );
    await queryRunner.query(
      `DELETE FROM business_hours_period WHERE locationId IS NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_config" DROP COLUMN "categoryCollapseThreshold"`,
    );
  }
}
