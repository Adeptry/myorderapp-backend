import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { nanoid } from 'nanoid';
import type { Relation } from 'typeorm';
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
import { EntityHelper } from '../../utils/entity-helper.js';
import { Catalog } from './catalog.entity.js';
import { Category } from './category.entity.js';
import { Item } from './item.entity.js';
import { ModifierList } from './modifier-list.entity.js';
import { Variation } from './variation.entity.js';

@Entity('catalog_image')
export class CatalogImage extends EntityHelper {
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
  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true, unique: false }) // TODO unique: true
  squareId?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  name?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  url?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  caption?: string | null;

  /* Relations */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  itemId?: string;

  @ManyToOne(() => Item, (entity) => entity.images, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'itemId' })
  item?: Relation<Item>;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  variationId?: string;

  @ManyToOne(() => Variation, (entity) => entity.images, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'variationId' })
  variation?: Relation<Variation>;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  categoryId?: string;

  @ManyToOne(() => Category, (entity) => entity.images, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'categoryId' })
  category?: Relation<Category>;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  modifierListId?: string;

  @ManyToOne(() => ModifierList, (entity) => entity.images, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'modifierListId' })
  modifierList?: Relation<ModifierList>;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: false })
  catalogId?: string;

  @ManyToOne(() => Catalog, (entity) => entity.variations, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'catalogId' })
  catalog?: Relation<Catalog>;
}
