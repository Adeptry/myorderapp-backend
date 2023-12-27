import { MigrationInterface, QueryRunner } from 'typeorm';

export class SquareSyncUpdate1703700724000 implements MigrationInterface {
  name = 'SquareSyncUpdate1703700724000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "modifier" ADD "synced" boolean`);
    await queryRunner.query(`ALTER TABLE "modifier_list" ADD "synced" boolean`);
    await queryRunner.query(`ALTER TABLE "variation" ADD "synced" boolean`);
    await queryRunner.query(`ALTER TABLE "item" ADD "synced" boolean`);
    await queryRunner.query(`ALTER TABLE "catalog_image" ADD "synced" boolean`);
    await queryRunner.query(`ALTER TABLE "category" ADD "synced" boolean`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "synced"`);
    await queryRunner.query(`ALTER TABLE "catalog_image" DROP COLUMN "synced"`);
    await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "synced"`);
    await queryRunner.query(`ALTER TABLE "variation" DROP COLUMN "synced"`);
    await queryRunner.query(`ALTER TABLE "modifier_list" DROP COLUMN "synced"`);
    await queryRunner.query(`ALTER TABLE "modifier" DROP COLUMN "synced"`);
  }
}
