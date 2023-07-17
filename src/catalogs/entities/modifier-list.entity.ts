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
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { MoaSelectionType } from '../dto/catalogs.types';
import { CatalogImage } from './catalog-image.entity';
import { Catalog } from './catalog.entity';
import { Item } from './item.entity';
import { Modifier } from './modifier.entity';

@Entity('modifier_list')
export class ModifierList extends EntityHelper {
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

  /* Squre */
  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true, unique: true })
  squareId?: string;

  @ApiProperty({ type: Number, required: false })
  @Column({ type: Number, nullable: true })
  minSelectedModifiers?: number | null;

  @ApiProperty({ type: Number, required: false })
  @Column({ type: Number, nullable: true })
  maxSelectedModifiers?: number | null;

  @ApiProperty({ type: Boolean, required: false })
  @Column({ type: Boolean, nullable: true })
  enabled?: boolean | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  name?: string | null;

  @ApiProperty({ required: false })
  @Column({ type: 'simple-enum', nullable: true, enum: MoaSelectionType })
  selectionType?: MoaSelectionType;

  @OneToMany(() => CatalogImage, (entity) => entity.modifierList, {
    nullable: true,
  })
  images?: CatalogImage[];

  /*
   * Relations
   */

  // Items

  @ManyToMany(() => Item, (entity) => entity.modifierLists, {
    onDelete: 'CASCADE',
    nullable: true,
    cascade: true,
  })
  items?: Item[];

  // Modifiers

  @ApiProperty({ type: () => Modifier, isArray: true, required: false })
  @OneToMany(() => Modifier, (entity) => entity.modifierList, {
    nullable: true,
    eager: true,
  })
  modifiers?: Modifier[];

  // Catalog

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: false })
  catalogId?: string;

  @ManyToOne(() => Catalog, (entity) => entity.modifierLists, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  catalog?: Catalog;
}
