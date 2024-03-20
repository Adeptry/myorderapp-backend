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
import { LineItemEntity } from './line-item.entity.js';

@Entity('line_item_modifier')
export class LineItemModifierEntity extends BaseEntity {
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

  /* Square variables */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  squareUid?: string; // | null;

  // @ApiProperty({ required: false, nullable: true })
  // @Column({ nullable: true })
  // modifierId?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  name?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  quantity?: string; // | null;

  @ApiProperty({ type: Number, nullable: true, required: false })
  @Column({ nullable: true })
  baseMoneyAmount?: number;

  @ApiProperty({ type: Number, nullable: true, required: false })
  @Column({ nullable: true })
  totalMoneyAmount?: number;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  lineItemId?: string;

  @ManyToOne(() => LineItemEntity, (entity) => entity.modifiers, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lineItemId' })
  lineItem?: Relation<LineItemEntity>;
}
