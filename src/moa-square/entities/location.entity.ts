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
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { AddressEntity } from './address.entity.js';
import { BusinessHoursPeriodEntity } from './business-hours-period.entity.js';
import { CustomerEntity } from './customer.entity.js';
import { MerchantEntity } from './merchant.entity.js';
import { ModifierLocationOverrideEntity } from './modifier-location-override.entity.js';
import { VariationLocationOverride } from './variation-location-override.entity.js';

@Entity('location')
export class LocationEntity extends BaseEntity {
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

  /*
   * Moa
   */
  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true, default: 0 })
  moaOrdinal?: number;

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true, default: true })
  moaEnabled?: boolean;

  /*
   * Square
   */
  @ApiProperty({ type: Boolean, required: true })
  @Column({ type: Boolean, nullable: true, default: false })
  isMain?: boolean;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  name?: string | null;

  @ApiProperty({ type: Number, required: false, nullable: true })
  @Column({ type: Number, nullable: true })
  latitude?: number | null;

  @ApiProperty({ type: Number, required: false, nullable: true })
  @Column({ type: Number, nullable: true })
  longitude?: number | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  description?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  phoneNumber?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  status?: string | null;

  /**
   * The [IANA time zone](https://www.iana.org/time-zones) identifier for
   * the time zone of the location. For example, `America/Los_Angeles`.
   */
  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  timezone?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  country?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  languageCode?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  currency?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  businessName?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  type?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  websiteUrl?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  businessEmail?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  twitterUsername?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  instagramUsername?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  facebookUrl?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  logoUrl?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  posBackgroundUrl?: string;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  mcc?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  fullFormatLogoUrl?: string | null;

  /*
   * Merchant
   */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  merchantId?: string;

  @ManyToOne(() => MerchantEntity, (entity) => entity.locations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'merchantId' })
  merchant?: Relation<MerchantEntity>;

  /*
   * Merchant
   */

  @OneToMany(() => CustomerEntity, (entity) => entity.preferredLocation, {
    nullable: true,
    onDelete: 'NO ACTION',
  })
  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  preferredByCustomers?: CustomerEntity[];

  /*
   * Business Hours
   */

  @OneToMany(() => BusinessHoursPeriodEntity, (entity) => entity.location, {
    nullable: true,
  })
  @ApiProperty({
    type: BusinessHoursPeriodEntity,
    required: false,
    isArray: true,
    nullable: true,
  })
  businessHours?: BusinessHoursPeriodEntity[];

  /*
   * Address
   */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  addressId?: string;

  @OneToOne(() => AddressEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'addressId' })
  @ApiProperty({ type: AddressEntity, required: false, nullable: true })
  address?: Relation<AddressEntity> | null;

  /*
   * Overrides
   */

  @OneToMany(() => VariationLocationOverride, (entity) => entity.location, {
    nullable: true,
  })
  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  variationLocationOverrides?: VariationLocationOverride[];

  @OneToMany(
    () => ModifierLocationOverrideEntity,
    (entity) => entity.location,
    {
      nullable: true,
    },
  )
  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  modifierLocationOverrides?: ModifierLocationOverrideEntity[];

  /*
   * Square
   */

  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  @Column({ nullable: true })
  merchantSquareId?: string;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ nullable: true })
  squareId?: string;
}
