import { ApiProperty } from '@nestjs/swagger';
import {
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

import { Exclude } from 'class-transformer';
import { nanoid } from 'nanoid';
import { Location } from 'src/locations/entities/location.entity';
import { EntityHelper } from 'src/utils/entity-helper';
import { Modifier } from './modifier.entity';

@Entity('modifier_location_override')
export class ModifierLocationOverride extends EntityHelper {
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

  /* Square */

  @ApiProperty({ type: Number, required: false, nullable: true })
  @Column({ type: Number, nullable: true })
  amount?: number | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  currency?: string | null;

  /*
   * Relations
   */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  modifierId?: string;

  @ManyToOne(() => Modifier, (entity) => entity.locationOverrides, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'modifierId' })
  modifier?: Modifier;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  locationId?: string;

  @ManyToOne(() => Location, (entity) => entity.modifierLocationOverrides, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'locationId' })
  location?: Location;
}
