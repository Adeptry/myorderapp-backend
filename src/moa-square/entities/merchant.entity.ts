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
import { Exclude, Expose } from 'class-transformer';
import { nanoid } from 'nanoid';
import type { Relation } from 'typeorm';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { EncryptionTransformer } from 'typeorm-encrypted';
import { UserEntity } from '../../users/entities/user.entity.js';
import { MoaSquareEncryptionTransformerConfig } from '../utils/moa-square-encryption-transformer-config.js';
import { AppConfigEntity } from './app-config.entity.js';
import { CatalogEntity } from './catalog.entity.js';
import { CustomerEntity } from './customer.entity.js';
import { LocationEntity } from './location.entity.js';

@Entity('merchant')
export class MerchantEntity extends BaseEntity {
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

  @ApiProperty({ type: Number, required: false, nullable: true })
  @Column({ type: Number, nullable: true })
  tier?: number | null;

  @ApiProperty({ type: Number, required: false, nullable: true })
  @Column({ type: Number, nullable: true, default: 15 })
  pickupLeadDurationMinutes?: number | null;

  /*
   * User
   */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  userId?: string;

  @ApiProperty({ type: () => UserEntity, required: false, nullable: true })
  @ManyToOne(() => UserEntity)
  user?: Relation<UserEntity>;

  /*
   * App config
   */

  @ApiProperty({ required: false, nullable: true, type: () => AppConfigEntity })
  @OneToOne(() => AppConfigEntity, (entity) => entity.merchant, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  appConfig?: Relation<AppConfigEntity>;

  /*
   * Square Oauth
   */

  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  @Column({
    nullable: true,
    type: String,
    transformer: new EncryptionTransformer(
      MoaSquareEncryptionTransformerConfig,
    ),
  })
  squareAccessToken?: string | null;

  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  @Column({
    nullable: true,
    type: String,
    transformer: new EncryptionTransformer(
      MoaSquareEncryptionTransformerConfig,
    ),
  })
  squareRefreshToken?: string | null;

  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  @Column({ nullable: true, type: Date })
  squareExpiresAt?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true, type: String })
  squareId?: string | null;

  @Expose()
  @ApiProperty({ required: false, type: Boolean, nullable: true })
  get squareConnected(): boolean {
    return (
      this.squareAccessToken != undefined &&
      this.squareRefreshToken != undefined &&
      this.squareExpiresAt != undefined &&
      this.squareExpiresAt > new Date()
    );
  }

  /*
   * Square merchant
   */

  @ApiProperty({
    required: false,
    nullable: true,
    type: String,
    description: "The name of the merchant's overall business.",
  })
  @Column({ nullable: true, type: String })
  squareBusinessName?: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    type: String,
    description:
      'Indicates the country associated with another entity, such as a business. Values are in ISO 3166-1-alpha-2 format.',
  })
  @Column({ nullable: true, type: String })
  countryCode?: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'The code indicating the language preferences of the merchant, in [BCP 47 format](https://tools.ietf.org/html/bcp47#appendix-A). For example, `en-US` or `fr-CA`. ',
  })
  @Column({ nullable: true, type: String })
  languageCode?: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    type: String,
    description:
      'Indicates the associated currency for an amount of money. Values correspond to ISO 4217.',
  })
  @Column({ nullable: true, type: String })
  currencyCode?: string | null;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true, type: String })
  squareStatus?: string | null;

  @Column({ nullable: true, type: String })
  @Exclude({ toPlainOnly: true })
  squareMainLocationId?: string | null;

  /*
   * Stripe
   */

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  stripeId?: string;

  /*
   * Catalog
   */

  @ApiProperty({ required: false, nullable: true, type: () => CatalogEntity })
  @OneToOne(() => CatalogEntity, (entity) => entity.merchant, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  catalog?: Relation<CatalogEntity>;

  /*
   * Locations
   */

  @OneToMany(() => LocationEntity, (entity) => entity.merchant, {
    nullable: true,
  })
  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  locations?: LocationEntity[];

  /*
   * Customers
   */

  @OneToMany(() => CustomerEntity, (entity) => entity.merchant, {
    nullable: true,
    onDelete: 'NO ACTION',
  })
  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  customers?: CustomerEntity[];

  /*
   * Firebase
   */

  @Exclude({ toPlainOnly: true })
  @Column('simple-json', { nullable: true })
  firebaseAppOptions?: Record<string, any>;
}
