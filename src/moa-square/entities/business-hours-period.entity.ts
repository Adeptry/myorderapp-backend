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
import { LocationEntity } from './location.entity.js';

@Entity('business_hours_period')
export class BusinessHoursPeriodEntity extends BaseEntity {
  /* Base entity */

  @ApiProperty({ required: false, nullable: true })
  @PrimaryColumn('varchar')
  @Exclude({ toPlainOnly: true })
  id?: string;

  @BeforeInsert()
  setId() {
    this.id = nanoid();
  }

  @Exclude({ toPlainOnly: true })
  @CreateDateColumn({ nullable: true })
  @Exclude({ toPlainOnly: true })
  createDate?: Date;

  @Exclude({ toPlainOnly: true })
  @UpdateDateColumn({ nullable: true })
  @Exclude({ toPlainOnly: true })
  updateDate?: Date;

  @Exclude({ toPlainOnly: true })
  @DeleteDateColumn({ nullable: true })
  @Exclude({ toPlainOnly: true })
  deleteDate?: Date;

  @Exclude({ toPlainOnly: true })
  @VersionColumn({ nullable: true })
  @Exclude({ toPlainOnly: true })
  version?: number;

  /* Business hours period entity */

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description: 'Indicates the specific day  of the week.',
  })
  @Column({ type: String, nullable: true })
  dayOfWeek?: string | null;

  get dayOfWeekNumber(): number | null {
    switch (this.dayOfWeek?.toUpperCase()) {
      case 'SUN':
        return 0;
      case 'MON':
        return 1;
      case 'TUE':
        return 2;
      case 'WED':
        return 3;
      case 'THU':
        return 4;
      case 'FRI':
        return 5;
      case 'SAT':
        return 6;
      default:
        return null;
    }
  }

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description:
      'The start time of a business hours period, specified in local time using partial-time. RFC 3339 format. For example, `8:30:00` for a period starting at 8:30 in the morning. Note that the seconds value is always :00, but it is appended for conformance to the RFC.',
  })
  @Column({ type: String, nullable: true })
  startLocalTime?: string | null;

  get startLocalTimeHours(): number | undefined {
    const timeSplit = this.startLocalTime?.split(':');
    if (timeSplit != undefined && timeSplit.length >= 2) {
      return Number(timeSplit[0]);
    }
    return undefined;
  }

  get startLocalTimeMinutes(): number | undefined {
    const timeSplit = this.startLocalTime?.split(':');
    if (timeSplit != undefined && timeSplit.length >= 2) {
      return Number(timeSplit[1]);
    }
    return undefined;
  }

  get parsedStartLocalTimeNumberOfMinutes(): number | undefined {
    if (
      this.startLocalTimeHours != undefined &&
      this.startLocalTimeMinutes != undefined
    ) {
      return this.startLocalTimeHours * 60 + this.startLocalTimeMinutes;
    }

    return undefined;
  }

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    description:
      'The end time of a business hours period, specified in local time using partial-time. RFC 3339 format. For example, `21:00:00` for a period ending at 9:00 in the evening. Note that the seconds value is always :00, but it is appended for conformance to the RFC.',
  })
  @Column({ type: String, nullable: true })
  endLocalTime?: string | null;

  get endLocalTimeHours(): number | undefined {
    const timeSplit = this.endLocalTime?.split(':');
    if (timeSplit != undefined && timeSplit.length >= 2) {
      return Number(timeSplit[0]);
    }
    return undefined;
  }

  get endLocalTimeMinutes(): number | undefined {
    const timeSplit = this.endLocalTime?.split(':');
    if (timeSplit != undefined && timeSplit.length >= 2) {
      return Number(timeSplit[1]);
    }
    return undefined;
  }

  get parsedEndLocalTimeNumberOfMinutes(): number | undefined {
    if (
      this.endLocalTimeHours != undefined &&
      this.endLocalTimeMinutes != undefined
    ) {
      return this.endLocalTimeHours * 60 + this.endLocalTimeMinutes;
    }

    return undefined;
  }

  /* Relations */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  locationId?: string;

  @ManyToOne(() => LocationEntity, (entity) => entity.businessHours, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'locationId' })
  location?: Relation<LocationEntity>;
}
