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
import { CatalogImageEntity } from './catalog-image.entity.js';
import { CatalogEntity } from './catalog.entity.js';
import { CategoryEntity } from './category.entity.js';
import { ItemModifierListEntity } from './item-modifier-list.entity.js';
import { LocationEntity } from './location.entity.js';
import { VariationEntity } from './variation.entity.js';

@Entity('item')
export class ItemEntity extends BaseEntity {
  /*
   * Base entity
   */

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

  /*
   * Moa
   */

  @Column({ nullable: true })
  synced?: boolean;

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true, default: 0 })
  moaOrdinal?: number;

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true, default: true })
  moaEnabled?: boolean;

  /*
   * Square
   */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true, unique: false }) // TODO unique: true
  squareId?: string;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  name?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  description?: string | null;

  @OneToMany(() => CatalogImageEntity, (entity) => entity.item, {
    nullable: true,
  })
  @ApiProperty({
    type: () => CatalogImageEntity,
    isArray: true,
    required: false,
    nullable: true,
  })
  images?: CatalogImageEntity[];

  /*
   * Category
   */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  categoryId?: string;

  @ManyToOne(() => CategoryEntity, (entity) => entity.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'categoryId' })
  category?: Relation<CategoryEntity>;

  /*
   * Modifier lists
   */

  @ApiProperty({
    type: () => ItemModifierListEntity,
    isArray: true,
    required: false,
    nullable: true,
  })
  @OneToMany(
    () => ItemModifierListEntity,
    (itemModifierList) => itemModifierList.item,
  )
  itemModifierLists?: ItemModifierListEntity[];

  /*
   * Variations
   */

  @ApiProperty({
    type: () => VariationEntity,
    isArray: true,
    required: false,
    nullable: true,
  })
  @OneToMany(() => VariationEntity, (entity) => entity.item, {
    nullable: true,
  })
  variations?: VariationEntity[];

  /*
   * Catalog
   */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: false })
  catalogId?: string;

  @ManyToOne(() => CatalogEntity, (entity) => entity.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'catalogId' })
  catalog?: Relation<CatalogEntity>;

  /*
   *  Locations
   */

  @Column({ default: true, nullable: true, type: Boolean })
  @Exclude({ toPlainOnly: true })
  presentAtAllLocations?: boolean | null;

  @ManyToMany(() => LocationEntity)
  @JoinTable({
    name: 'items_present_at_locations',
    joinColumn: {
      name: 'itemId',
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
    name: 'items_absent_at_locations',
    joinColumn: {
      name: 'itemId',
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
