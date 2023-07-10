import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { nanoid } from 'nanoid';
import { Category } from 'src/catalogs/entities/category.entity';
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
export class Catalog extends EntityHelper {
  /* Base entity */

  @ApiProperty({ required: false })
  @PrimaryColumn('varchar')
  id?: string;

  @BeforeInsert()
  setId() {
    this.id = nanoid();
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
  @ApiProperty({ required: false, type: () => [Category], isArray: true })
  @OneToMany(() => Category, (entity) => entity.catalog, {
    nullable: true,
  })
  categories?: Category[];

  /*
   * Merchant
   */
  @OneToOne(() => MoaMerchant, (merchant) => merchant.catalog, {
    onDelete: 'CASCADE',
  })
  merchant?: MoaMerchant;
}
