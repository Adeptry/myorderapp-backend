import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { nanoid } from 'nanoid';
import type { Relation } from 'typeorm';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { CategoryEntity } from './category.entity.js';
import { ItemEntity } from './item.entity.js';
import { MerchantEntity } from './merchant.entity.js';
import { ModifierListEntity } from './modifier-list.entity.js';
import { ModifierEntity } from './modifier.entity.js';
import { VariationEntity } from './variation.entity.js';

@Entity('catalog')
export class CatalogEntity extends BaseEntity {
  /* Base entity */

  @ApiProperty({ required: false, nullable: true })
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
  @ApiProperty({
    required: false,
    type: () => CategoryEntity,
    isArray: true,
    nullable: true,
  })
  @OneToMany(() => CategoryEntity, (entity) => entity.catalog, {
    nullable: true,
  })
  categories?: CategoryEntity[];

  @Exclude({ toPlainOnly: true })
  @OneToMany(() => ItemEntity, (entity) => entity.catalog, {
    nullable: true,
  })
  items?: ItemEntity[];

  @Exclude({ toPlainOnly: true })
  @OneToMany(() => ModifierListEntity, (entity) => entity.catalog, {
    nullable: true,
  })
  modifierLists?: ModifierListEntity[];

  @Exclude({ toPlainOnly: true })
  @OneToMany(() => ModifierEntity, (entity) => entity.catalog, {
    nullable: true,
  })
  modifiers?: ModifierEntity[];

  @Exclude({ toPlainOnly: true })
  @OneToMany(() => VariationEntity, (entity) => entity.catalog, {
    nullable: true,
  })
  variations?: VariationEntity[];

  /*
   * Merchant
   */

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  merchantId?: string;

  @OneToOne(() => MerchantEntity, (entity) => entity.catalog, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'merchantId' })
  merchant?: Relation<MerchantEntity>;
}
