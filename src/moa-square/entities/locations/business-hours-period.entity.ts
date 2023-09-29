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
      case 'SUN':
        return 7; // or 0, depending on your numbering system
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
  location?: Relation<LocationEntity>;
}
