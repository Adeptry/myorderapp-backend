/*
    This code is part of myorderapp-backend, a multi-tenant Square-based CMS.
    Copyright (C) 2024  Adeptry, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
 */

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
