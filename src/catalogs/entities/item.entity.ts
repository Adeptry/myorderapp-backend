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
import { MoaCategory } from './category.entity';
import { MoaModifierList } from './modifier-list.entity';
import { MoaVariation } from './variation.entity';

@Entity('item')
export class MoaItem extends EntityHelper {
  /* Base entity */

  @ApiProperty({ required: false })
  @PrimaryColumn('varchar')
  moaId?: string;

  @BeforeInsert()
  setMoaId() {
    this.moaId = nanoid();
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
  /*
   * Moameta
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
  categoryMoaId?: string;

  @ManyToOne(() => MoaCategory, (category) => category.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  category?: MoaCategory;

  /*
   * Modifier lists
   */

  @ApiProperty({ type: () => MoaModifierList, isArray: true, required: false })
  @ManyToMany(() => MoaModifierList, (entity) => entity.items, {
    nullable: true,
  })
  modifierLists?: MoaModifierList[];

  /*
   * Variations
   */
  @ApiProperty({ type: () => MoaVariation, isArray: true, required: false })
  @OneToMany(() => MoaVariation, (entity) => entity.item, {
    nullable: true,
  })
  variations?: MoaVariation[];
}
