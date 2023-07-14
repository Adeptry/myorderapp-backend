import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { nanoid } from 'nanoid';
import { EntityHelper } from 'src/utils/entity-helper';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { Entity } from 'typeorm/decorator/entity/Entity';
import { Location } from './location.entity';

@Entity('business_hours_period')
export class BusinessHoursPeriod extends EntityHelper {
  /* Base entity */

  @ApiProperty({ required: false })
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
    description: 'Indicates the specific day  of the week.',
  })
  @Column({ type: String, nullable: true })
  dayOfWeek?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    description:
      'The start time of a business hours period, specified in local time using partial-time. RFC 3339 format. For example, `8:30:00` for a period starting at 8:30 in the morning. Note that the seconds value is always :00, but it is appended for conformance to the RFC.',
  })
  @Column({ type: String, nullable: true })
  startLocalTime?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    description:
      'The end time of a business hours period, specified in local time using partial-time. RFC 3339 format. For example, `21:00:00` for a period ending at 9:00 in the evening. Note that the seconds value is always :00, but it is appended for conformance to the RFC.',
  })
  @Column({ type: String, nullable: true })
  endLocalTime?: string | null;

  /* Relations */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  locationId?: string;

  @ManyToOne(() => Location, (entity) => entity.businessHours, {
    onDelete: 'SET NULL',
  })
  location?: Location;
}
