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
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { CatalogEntity } from './catalog.entity.js';
import { LocationEntity } from './location.entity.js';
import { ModifierListEntity } from './modifier-list.entity.js';
import { ModifierLocationOverrideEntity } from './modifier-location-override.entity.js';

@Entity('modifier')
export class ModifierEntity extends BaseEntity {
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

  /* Entity */
  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true, unique: false }) // TODO unique: true
  squareId?: string;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  name?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  priceMoneyAmount?: number;

  @ApiProperty({ type: Number, required: false, nullable: true })
  @Column({ type: Number, nullable: true })
  ordinal?: number | null;

  @Column({ nullable: true })
  synced?: boolean;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  modifierListId?: string;

  @ManyToOne(() => ModifierListEntity, (entity) => entity.modifiers, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'modifierListId' })
  modifierList?: Relation<ModifierListEntity> | null;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: false })
  catalogId?: string;

  @ManyToOne(() => CatalogEntity, (entity) => entity.modifiers, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'catalogId' })
  catalog?: Relation<CatalogEntity>;

  // Locations

  @OneToMany(
    () => ModifierLocationOverrideEntity,
    (entity) => entity.modifier,
    {
      nullable: true,
    },
  )
  @Exclude({ toPlainOnly: true })
  locationOverrides?: ModifierLocationOverrideEntity[];

  @Column({ default: true, nullable: true, type: Boolean })
  @Exclude({ toPlainOnly: true })
  presentAtAllLocations?: boolean | null;

  @ManyToMany(() => LocationEntity)
  @JoinTable({
    name: 'modifiers_present_at_locations',
    joinColumn: {
      name: 'modifierId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'locationId',
      referencedColumnName: 'id',
    },
  })
  @Exclude({ toPlainOnly: true })
  presentAtLocations?: LocationEntity[];

  @ManyToMany(() => LocationEntity)
  @JoinTable({
    name: 'modifiers_absent_at_locations',
    joinColumn: {
      name: 'modifierId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'locationId',
      referencedColumnName: 'id',
    },
  })
  @Exclude({ toPlainOnly: true })
  absentAtLocations?: LocationEntity[];
}
