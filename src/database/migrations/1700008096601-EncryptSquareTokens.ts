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

import { Logger } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { EncryptionTransformer } from 'typeorm-encrypted';
import { MerchantEntity } from '../../moa-square/entities/merchant.entity.js';
import { MoaSquareEncryptionTransformerConfig } from '../../moa-square/utils/moa-square-encryption-transformer-config.js';

export class EncryptSquareTokens1700008096601 implements MigrationInterface {
  private readonly logger = new Logger(EncryptSquareTokens1700008096601.name);

  public async up(queryRunner: QueryRunner): Promise<void> {
    this.logger.verbose(this.up.name);

    const merchants: Array<MerchantEntity> = await queryRunner.query(
      `SELECT id, "squareAccessToken", "squareRefreshToken" FROM merchant`,
    );
    const transformer = new EncryptionTransformer(
      MoaSquareEncryptionTransformerConfig,
    );

    for (const merchant of merchants) {
      const encryptedSquareAccessToken = transformer.to(
        merchant.squareAccessToken,
      );
      await queryRunner.query(
        `UPDATE merchant SET "squareAccessToken" = '${encryptedSquareAccessToken}' WHERE id = '${merchant.id}'`,
      );

      const encryptedSquareRefreshToken = transformer.to(
        merchant.squareRefreshToken,
      );
      await queryRunner.query(
        `UPDATE merchant SET "squareRefreshToken" = '${encryptedSquareRefreshToken}' WHERE id = '${merchant.id}'`,
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
