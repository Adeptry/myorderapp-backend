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
import { LocationEntity } from '../locations/location.entity.js';
import { CatalogEntity } from './catalog.entity.js';
import { VariationEntity } from './variation.entity.js';

@Entity('variation_location_override')
export class VariationLocationOverride extends BaseEntity {
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
  variationId?: string;

  @ManyToOne(() => VariationEntity, (entity) => entity.locationOverrides, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'variationId' })
  variation?: Relation<VariationEntity>;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  locationId?: string;

  @ManyToOne(
    () => LocationEntity,
    (entity) => entity.variationLocationOverrides,
    {
      onDelete: 'CASCADE',
      nullable: false,
    },
  )
  @JoinColumn({ name: 'locationId' })
  location?: Relation<LocationEntity>;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: false })
  catalogId?: string;

  @ManyToOne(() => CatalogEntity, (entity) => entity.modifierLists, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  catalog?: Relation<CatalogEntity>;
}