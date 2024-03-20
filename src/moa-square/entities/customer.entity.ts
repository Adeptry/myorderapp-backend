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

import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
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
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity.js';
import { SquareCard } from '../dto/square/square.dto.js';
import { AppInstallEntity } from './app-install.entity.js';
import { LocationEntity } from './location.entity.js';
import { MerchantEntity } from './merchant.entity.js';
import { OrderEntity } from './order.entity.js';

@Index(['userId', 'merchantId'], { unique: true })
@Entity('customer')
export class CustomerEntity extends BaseEntity {
  /* Base entity */

  @ApiProperty({ required: false, nullable: true })
  @PrimaryColumn('varchar')
  id?: string;

  @BeforeInsert()
  setId() {
    this.id = nanoid();
  }

  @ApiProperty({ type: () => Date, nullable: true, required: false })
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

  /* User */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  userId?: string;

  @ApiProperty({ type: () => UserEntity, required: false, nullable: true })
  @ManyToOne(() => UserEntity, (entity) => entity.customers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user?: Relation<UserEntity>;

  /* Merchant */

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  merchantId?: string;

  @ManyToOne(() => MerchantEntity, (entity) => entity.customers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'merchantId' })
  merchant?: Relation<MerchantEntity>;

  /* Current order */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  currentOrderId?: string;

  @OneToOne(() => OrderEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'currentOrderId' })
  currentOrder?: Relation<OrderEntity> | null;

  /* Orders */

  @OneToMany(() => OrderEntity, (entity) => entity.customer, {
    nullable: true,
  })
  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  orders?: OrderEntity[];

  /* Installs */

  @OneToMany(() => AppInstallEntity, (entity) => entity.customer, {
    nullable: true,
  })
  appInstalls?: AppInstallEntity[];

  /* Square */

  @Exclude({ toPlainOnly: true })
  @Column('text')
  squareId?: string;

  /*
   * Preferred location
   */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  preferredLocationId?: string;

  @ApiProperty({ type: () => LocationEntity, nullable: true, required: false })
  @ManyToOne(() => LocationEntity, (entity) => entity.preferredByCustomers, {
    onDelete: 'SET NULL',
    nullable: false,
  })
  @JoinColumn({ name: 'preferredLocationId' })
  preferredLocation?: Relation<LocationEntity> | null;

  /*
   * Preferred card
   */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true, type: String })
  preferredSquareCardId?: string | null;

  @ApiProperty({ required: false, type: SquareCard, nullable: true })
  preferredSquareCard?: SquareCard;

  /*
   * Notifications
   */

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ nullable: true, default: true })
  mailNotifications?: boolean;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ nullable: true, default: true })
  messageNotifications?: boolean;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ nullable: true, default: true })
  pushNotifications?: boolean;
}
