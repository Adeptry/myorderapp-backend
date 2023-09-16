import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { nanoid } from 'nanoid';
import {
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
import { Location } from '../../locations/entities/location.entity.js';
import { EntityHelper } from '../../utils/entity-helper.js';
import { MoaSelectionType } from '../dto/catalogs.types.js';
import { CatalogImage } from './catalog-image.entity.js';
import type { Catalog } from './catalog.entity.js';
import { ItemModifierList } from './item-modifier-list.entity.js';
import { Modifier } from './modifier.entity.js';

@Entity('modifier_list')
export class ModifierList extends EntityHelper {
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

  @OneToMany(() => CatalogImage, (entity) => entity.modifierList, {
    nullable: true,
  })
  images?: CatalogImage[];

  /*
   * Relations
   */

  // Presence

  @Column({ default: true, nullable: true, type: Boolean })
  @Exclude({ toPlainOnly: true })
  presentAtAllLocations?: boolean | null;

  @ManyToMany(() => Location)
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
  presentAtLocations?: Location[];

  @ManyToMany(() => Location)
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
  absentAtLocations?: Location[];

  // Items

  @OneToMany(
    () => ItemModifierList,
    (itemModifierList) => itemModifierList.modifierList,
  )
  itemModifierLists: ItemModifierList[];

  // Modifiers

  @ApiProperty({
    type: () => Modifier,
    isArray: true,
    required: false,
    nullable: true,
  })
  @OneToMany(() => Modifier, (entity) => entity.modifierList, {
    nullable: true,
    eager: true,
  })
  modifiers?: Modifier[];

  // Catalog

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: false })
  catalogId?: string;

  @ManyToOne('Catalog', 'modifierLists', {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  catalog?: Catalog;
}
