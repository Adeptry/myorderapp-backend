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
import { VariationLocationOverride } from './variation-location-override.entity';

@Entity('variation')
export class Variation extends EntityHelper {
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
  ordinal?: number;

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

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  priceInCents?: number;

  /*
   * Relations
   */

  @OneToMany(() => CatalogImage, (entity) => entity.variation, {
    nullable: true,
  })
  images?: CatalogImage[];

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  itemId?: string;

  @ManyToOne(() => Item, (entity) => entity.variations, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  item?: Item;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: false })
  catalogId?: string;

  @ManyToOne(() => Catalog, (entity) => entity.variations, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'catalogId' })
  catalog?: Catalog;

  @OneToMany(() => VariationLocationOverride, (entity) => entity.variation, {
    nullable: true,
  })
  @Exclude({ toPlainOnly: true })
  locationOverrides?: VariationLocationOverride[];
}
