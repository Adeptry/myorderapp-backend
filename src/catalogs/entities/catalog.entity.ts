import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { nanoid } from 'nanoid';
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
import { Category } from '../../catalogs/entities/category.entity.js';
import type { Merchant } from '../../merchants/entities/merchant.entity.js';
import { EntityHelper } from '../../utils/entity-helper.js';
import { Item } from './item.entity.js';
import { ModifierList } from './modifier-list.entity.js';
import { Modifier } from './modifier.entity.js';
import { Variation } from './variation.entity.js';

@Entity('catalog')
export class Catalog extends EntityHelper {
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
    type: () => [Category],
    isArray: true,
    nullable: true,
  })
  @OneToMany(() => Category, (entity) => entity.catalog, {
    nullable: true,
  })
  categories?: Category[];

  @Exclude({ toPlainOnly: true })
  @OneToMany(() => Item, (entity) => entity.catalog, {
    nullable: true,
  })
  items?: Item[];

  @Exclude({ toPlainOnly: true })
  @OneToMany(() => ModifierList, (entity) => entity.catalog, {
    nullable: true,
  })
  modifierLists?: ModifierList[];

  @Exclude({ toPlainOnly: true })
  @OneToMany(() => Modifier, (entity) => entity.catalog, {
    nullable: true,
  })
  modifiers?: Modifier[];

  @Exclude({ toPlainOnly: true })
  @OneToMany(() => Variation, (entity) => entity.catalog, {
    nullable: true,
  })
  variations?: Variation[];

  /*
   * Merchant
   */
  @OneToOne('Merchant', 'catalog', {
    onDelete: 'CASCADE',
  })
  merchant?: Merchant;
}
