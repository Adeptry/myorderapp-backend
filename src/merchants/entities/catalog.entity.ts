import { ApiProperty } from '@nestjs/swagger';
import { nanoid } from 'nanoid';
import { MoaCategory } from 'src/merchants/entities/category.entity';
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

  @PrimaryColumn('varchar')
  moaId?: string;

  @BeforeInsert()
  setMoaId() {
    this.moaId = nanoid();
  }

  @CreateDateColumn({ nullable: true })
  createDate?: Date;

  @UpdateDateColumn({ nullable: true })
  updateDate?: Date;

  @DeleteDateColumn({ nullable: true })
  deleteDate?: Date;

  @VersionColumn({ nullable: true })
  version?: number;

  /* Entity */
  /*
   * Categories
   */
  @OneToMany(() => MoaCategory, (category) => category.catalog, {
    nullable: true,
    eager: true,
  })
  @ApiProperty()
  categories?: MoaCategory[];

  /*
   * Merchant
   */
  @OneToOne(() => MoaMerchant, (merchant) => merchant.catalog, {
    onDelete: 'CASCADE',
  })
  @ApiProperty()
  merchant?: MoaMerchant;
}
