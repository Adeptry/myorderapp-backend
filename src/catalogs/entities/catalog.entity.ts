import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { nanoid } from 'nanoid';
import { MoaCategory } from 'src/catalogs/entities/category.entity';
import { MoaMerchant } from 'src/merchants/entities/merchant.entity';
import { EntityHelper } from 'src/utils/entity-helper';
import {
  BeforeInsert,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

@Entity('catalog')
export class MoaCatalog extends EntityHelper {
  /* Base entity */

  @ApiProperty({ required: false })
  @PrimaryColumn('varchar')
  moaId?: string;

  @BeforeInsert()
  setMoaId() {
    this.moaId = nanoid();
  }

  @Exclude({ toPlainOnly: true })
  @CreateDateColumn({ nullable: true })
  createDate?: Date;

  @Exclude({ toPlainOnly: true })
  @UpdateDateColumn({ nullable: true })
  updateDate?: Date;

  @Exclude({ toPlainOnly: true })
  @DeleteDateColumn({ nullable: true })
  deleteDate?: Date;

  @Exclude({ toPlainOnly: true })
  @VersionColumn({ nullable: true })
  version?: number;

  /* Entity */
  /*
   * Categories
   */
  @ApiProperty({ required: false, type: () => [MoaCategory], isArray: true })
  @OneToMany(() => MoaCategory, (category) => category.catalog, {
    nullable: true,
  })
  categories?: MoaCategory[];

  /*
   * Merchant
   */
  @OneToOne(() => MoaMerchant, (merchant) => merchant.catalog, {
    onDelete: 'CASCADE',
  })
  merchant?: MoaMerchant;
}
