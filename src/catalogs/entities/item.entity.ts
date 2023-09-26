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
import { Location } from '../../locations/entities/location.entity.js';
import { CatalogImage } from './catalog-image.entity.js';
import { Catalog } from './catalog.entity.js';
import { Category } from './category.entity.js';
import { ItemModifierList } from './item-modifier-list.entity.js';
import { Variation } from './variation.entity.js';

@Entity('item')
export class Item extends BaseEntity {
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

  @OneToMany(() => CatalogImage, (entity) => entity.item, {
    nullable: true,
  })
  @ApiProperty({
    type: () => CatalogImage,
    isArray: true,
    required: false,
    nullable: true,
  })
  images?: CatalogImage[];

  /*
   * Category
   */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  categoryId?: string;

  @ManyToOne(() => Category, (entity) => entity.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  category?: Relation<Category>;

  /*
   * Modifier lists
   */

  @ApiProperty({
    type: () => ItemModifierList,
    isArray: true,
    required: false,
    nullable: true,
  })
  @OneToMany(
    () => ItemModifierList,
    (itemModifierList) => itemModifierList.item,
  )
  itemModifierLists?: ItemModifierList[];

  /*
   * Variations
   */

  @ApiProperty({
    type: () => Variation,
    isArray: true,
    required: false,
    nullable: true,
  })
  @OneToMany(() => Variation, (entity) => entity.item, {
    nullable: true,
  })
  variations?: Variation[];

  /*
   * Catalog
   */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: false })
  catalogId?: string;

  @ManyToOne(() => Catalog, (entity) => entity.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  catalog?: Relation<Catalog>;

  /*
   *  Locations
   */

  @Column({ default: true, nullable: true, type: Boolean })
  @Exclude({ toPlainOnly: true })
  presentAtAllLocations?: boolean | null;

  @ManyToMany(() => Location)
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
  presentAtLocations?: Location[];

  @ManyToMany(() => Location)
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
  absentAtLocations?: Location[];
}
