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
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { CatalogImage } from './catalog-image.entity';
import { Catalog } from './catalog.entity';
import { Item } from './item.entity';

@Entity('category')
export class Category extends EntityHelper {
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

  /* Entity */

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
  @Column({ nullable: true, unique: false }) // TODO unique: true
  squareId?: string;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  name?: string | null;

  /*
   * Relations
   */

  @OneToMany(() => CatalogImage, (entity) => entity.category, {
    nullable: true,
  })
  images?: CatalogImage[];

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  catalogId?: string;

  @ManyToOne(() => Catalog, (entity) => entity.categories, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  catalog?: Catalog;

  @ApiProperty({ type: () => Item, isArray: true, required: false })
  @OneToMany(() => Item, (item) => item.category, {
    nullable: true,
  })
  items?: Item[];
}
