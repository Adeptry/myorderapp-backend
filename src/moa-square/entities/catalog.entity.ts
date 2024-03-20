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
