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
import { MoaSelectionType } from '../dto/catalogs/catalogs.types.js';
import { CatalogImageEntity } from './catalog-image.entity.js';
import { CatalogEntity } from './catalog.entity.js';
import { ItemModifierListEntity } from './item-modifier-list.entity.js';
import { LocationEntity } from './location.entity.js';
import { ModifierEntity } from './modifier.entity.js';

@Entity('modifier_list')
export class ModifierListEntity extends BaseEntity {
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

  /* Moa */

  @Column({ nullable: true })
  synced?: boolean;

  /* Square */
  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true, unique: false }) // TODO unique: true
  squareId?: string;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  name?: string | null;

  @ApiProperty({ type: Number, required: false, nullable: true })
  @Column({ type: Number, nullable: true })
  ordinal?: number | null;

  @ApiProperty({
    required: false,
    nullable: true,
    enum: Object.values(MoaSelectionType),
    enumName: 'MoaSelectionType',
    default: MoaSelectionType.SINGLE,
  })
  @Column({ type: 'simple-enum', nullable: true, enum: MoaSelectionType })
  selectionType?: MoaSelectionType;

  @OneToMany(() => CatalogImageEntity, (entity) => entity.modifierList, {
    nullable: true,
  })
  images?: CatalogImageEntity[];

  /*
   * Relations
   */

  // Presence

  @Column({ default: true, nullable: true, type: Boolean })
  @Exclude({ toPlainOnly: true })
  presentAtAllLocations?: boolean | null;

  @ManyToMany(() => LocationEntity)
  @JoinTable({
    name: 'modifier_lists_present_at_locations',
    joinColumn: {
      name: 'modifierListId',
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
    name: 'modifier_lists_absent_at_locations',
    joinColumn: {
      name: 'modifierListId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'locationId',
      referencedColumnName: 'id',
    },
  })
  @Exclude({ toPlainOnly: true })
  absentAtLocations?: LocationEntity[];

  // Items

  @OneToMany(
    () => ItemModifierListEntity,
    (itemModifierList) => itemModifierList.modifierList,
  )
  itemModifierLists?: ItemModifierListEntity[];

  // Modifiers

  @ApiProperty({
    type: () => ModifierEntity,
    isArray: true,
    required: false,
    nullable: true,
  })
  @OneToMany(() => ModifierEntity, (entity) => entity.modifierList, {
    nullable: true,
    eager: true,
  })
  modifiers?: ModifierEntity[];

  // Catalog

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: false })
  catalogId?: string;

  @ManyToOne(() => CatalogEntity, (entity) => entity.modifierLists, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'catalogId' })
  catalog?: Relation<CatalogEntity>;
}
