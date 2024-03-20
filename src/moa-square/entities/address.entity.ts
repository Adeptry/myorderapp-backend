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
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { LocationEntity } from './location.entity.js';

@Entity('address')
export class AddressEntity extends BaseEntity {
  /* Base entity */

  @ApiProperty({ required: false, nullable: true })
  @PrimaryColumn('varchar')
  @Exclude({ toPlainOnly: true })
  id?: string;

  @BeforeInsert()
  setId() {
    this.id = nanoid();
  }

  @CreateDateColumn({ nullable: true })
  @Exclude({ toPlainOnly: true })
  createDate?: Date;

  @UpdateDateColumn({ nullable: true })
  @Exclude({ toPlainOnly: true })
  updateDate?: Date;

  @DeleteDateColumn({ nullable: true })
  @Exclude({ toPlainOnly: true })
  deleteDate?: Date;

  @VersionColumn({ nullable: true })
  @Exclude({ toPlainOnly: true })
  version?: number;

  /* Address entity */

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: 'The first line of the address.',
  })
  @Column({ type: 'varchar', nullable: true })
  addressLine1?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: 'The second line of the address, if any.',
  })
  @Column({ type: 'varchar', nullable: true })
  addressLine2?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: 'The third line of the address, if any.',
  })
  @Column({ type: 'varchar', nullable: true })
  addressLine3?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: 'The city or town of the address.',
  })
  @Column({ type: 'varchar', nullable: true })
  locality?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: "A civil region within the address's `locality`, if any.",
  })
  @Column({ type: 'varchar', nullable: true })
  sublocality?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: "A civil region within the address's `sublocality`, if any.",
  })
  @Column({ type: 'varchar', nullable: true })
  sublocality2?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: "A civil region within the address's `sublocality_2`, if any.",
  })
  @Column({ type: 'varchar', nullable: true })
  sublocality3?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description:
      "A civil entity within the address's country. In the US, this is the state.",
  })
  @Column({ type: 'varchar', nullable: true })
  administrativeDistrictLevel1?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description:
      "A civil entity within the address's `administrative_district_level_1`. In the US, this is the county.",
  })
  @Column({ type: 'varchar', nullable: true })
  administrativeDistrictLevel2?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description:
      "A civil entity within the address's `administrative_district_level_2`, if any.",
  })
  @Column({ type: 'varchar', nullable: true })
  administrativeDistrictLevel3?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: "The address's postal code.",
  })
  @Column({ type: 'varchar', nullable: true })
  postalCode?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description:
      'Indicates the country associated with another entity, such as a business. Values are in ISO 3166-1-alpha-2 format.',
  })
  @Column({ type: 'varchar', nullable: false })
  country?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: "Optional first name when it's representing recipient.",
  })
  @Column({ type: 'varchar', nullable: true })
  firstName?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: "Optional last name when it's representing recipient.",
  })
  @Column({ type: 'varchar', nullable: true })
  lastName?: string | null;

  /* Relations */

  @OneToOne('LocationEntity', 'address', {
    onDelete: 'CASCADE',
  })
  location?: Relation<LocationEntity>;
}
