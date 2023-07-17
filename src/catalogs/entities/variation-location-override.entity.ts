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
import { Variation } from './variation.entity';

@Entity('variation_location_override')
export class VariationLocationOverride extends EntityHelper {
  /* Base entity */

  @ApiProperty({ required: false })
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

  @ApiProperty({ type: Number, required: false })
  @Column({ type: Number, nullable: true })
  amount?: number | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  currency?: string | null;

  /*
   * Relations
   */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  variationId?: string;

  @ManyToOne(() => Variation, (entity) => entity.locationOverrides, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'variationId' })
  variation?: Variation;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  locationId?: string;

  @ManyToOne(() => Location, (entity) => entity.variationLocationOverrides, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'locationId' })
  location?: Location;
}
