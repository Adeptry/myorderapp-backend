import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { nanoid } from 'nanoid';
import { EntityHelper } from 'src/utils/entity-helper';
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
import { Catalog } from './catalog.entity';
import { Category } from './category.entity';
import { ModifierList } from './modifier-list.entity';
import { Variation } from './variation.entity';

@Entity('item')
export class Item extends EntityHelper {
  /*
   * Base entity
   */

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

  /*
   * Moa
   */

  @ApiProperty({ required: false })
  @Column({ nullable: true, default: 0 })
  moaOrdinal?: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true, default: true })
  moaEnabled?: boolean;

  /*
   * Square
   */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true, unique: true })
  squareId?: string;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  name?: string | null;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  priceInCents?: number;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  description?: string | null;

  /*
   * Category
   */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  categoryId?: string;

  @ManyToOne(() => Category, (category) => category.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  category?: Category;

  /*
   * Modifier lists
   */

  @ApiProperty({ type: () => ModifierList, isArray: true, required: false })
  @ManyToMany(() => ModifierList, (entity) => entity.items, {
    nullable: true,
  })
  @JoinTable({
    name: 'items_modifier_lists', // name of the table that will be created in the database
    joinColumn: {
      name: 'item',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'modifierList',
      referencedColumnName: 'id',
    },
  })
  modifierLists?: ModifierList[];

  /*
   * Variations
   */

  @ApiProperty({ type: () => Variation, isArray: true, required: false })
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
  catalog?: Catalog;
}
