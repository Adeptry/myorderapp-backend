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
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { ItemEntity } from './item.entity.js';
import { ModifierListEntity } from './modifier-list.entity.js';

@Entity('item_modifier_list')
export class ItemModifierListEntity extends BaseEntity {
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

  @ApiProperty({ type: Number, required: false, nullable: true })
  @Column({ type: Number, nullable: true })
  minSelectedModifiers?: number | null;

  @ApiProperty({ type: Number, required: false, nullable: true })
  @Column({ type: Number, nullable: true })
  maxSelectedModifiers?: number | null;

  @ApiProperty({ type: Boolean, required: false, nullable: true })
  @Column({ type: Boolean, nullable: true })
  enabled?: boolean | null;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: false })
  itemId?: string;

  @ApiProperty({
    type: () => ItemEntity,
    required: false,
    nullable: true,
  })
  @ManyToOne(() => ItemEntity, (entity) => entity.itemModifierLists, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'itemId' })
  item?: Relation<ItemEntity>;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: false })
  modifierListId?: string;

  @ApiProperty({
    type: () => ModifierListEntity,
    required: false,
    nullable: true,
  })
  @ManyToOne(() => ModifierListEntity, (entity) => entity.itemModifierLists, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'modifierListId' })
  modifierList?: Relation<ModifierListEntity>;

  @ApiProperty({
    type: () => String,
    isArray: true,
    required: false,
    nullable: true,
  })
  @Column('simple-array', { nullable: true })
  onByDefaultModifierIds?: string[];
}
