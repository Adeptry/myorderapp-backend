import { EncryptionOptions } from 'typeorm-encrypted';

if (!process.env.SQUARE_ENCRYPTION_TOKEN) {
  throw new Error('SQUARE_ENCRYPTION_TOKEN is not defined');
}

export const MoaSquareEncryptionTransformerConfig: EncryptionOptions = {
  key: process.env.SQUARE_ENCRYPTION_TOKEN!,
  algorithm: 'aes-256-cbc',
  ivLength: 16,
};
