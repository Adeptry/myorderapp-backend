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
import { EntityHelper } from 'src/utils/entity-helper';
import { Catalog } from './catalog.entity';
import { Category } from './category.entity';
import { Item } from './item.entity';
import { ModifierList } from './modifier-list.entity';
import { Variation } from './variation.entity';

@Entity('catalog_image')
export class CatalogImage extends EntityHelper {
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

  @Exclude({ toPlainOnly: true })
  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true, unique: false }) // TODO unique: true
  squareId?: string | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  name?: string | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  url?: string | null;

  @ApiProperty({ type: String, required: false })
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
  item?: Item;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  variationId?: string;

  @ManyToOne(() => Variation, (entity) => entity.images, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'variationId' })
  variation?: Variation;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  categoryId?: string;

  @ManyToOne(() => Category, (entity) => entity.images, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'categoryId' })
  category?: Category;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  modifierListId?: string;

  @ManyToOne(() => ModifierList, (entity) => entity.images, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'modifierListId' })
  modifierList?: ModifierList;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: false })
  catalogId?: string;

  @ManyToOne(() => Catalog, (entity) => entity.variations, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'catalogId' })
  catalog?: Catalog;
}
