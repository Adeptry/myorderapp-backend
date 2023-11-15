import { Logger } from '@nestjs/common';
import { MerchantEntity } from 'src/moa-square/entities/merchant.entity.js';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { EncryptionTransformer } from 'typeorm-encrypted';
import { MoaSquareEncryptionTransformerConfig } from '../../moa-square/moa-square.config.js';

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
