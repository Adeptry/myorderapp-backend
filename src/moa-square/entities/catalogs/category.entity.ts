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
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { CatalogImageEntity } from './catalog-image.entity.js';
import { CatalogEntity } from './catalog.entity.js';
import { ItemEntity } from './item.entity.js';

@Entity('category')
export class CategoryEntity extends BaseEntity {
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

  /*
   * Relations
   */

  @OneToMany(() => CatalogImageEntity, (entity) => entity.category, {
    nullable: true,
  })
  images?: CatalogImageEntity[];

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  catalogId?: string;

  @ManyToOne(() => CatalogEntity, (entity) => entity.categories, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  catalog?: Relation<CatalogEntity>;

  @ApiProperty({
    type: () => ItemEntity,
    isArray: true,
    required: false,
    nullable: true,
  })
  @OneToMany(() => ItemEntity, (item) => item.category, {
    nullable: true,
  })
  items?: ItemEntity[];
}
