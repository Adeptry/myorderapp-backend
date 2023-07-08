import { ApiProperty } from '@nestjs/swagger';
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

  @PrimaryColumn('varchar')
  moaId?: string;

  @BeforeInsert()
  setMoaId() {
    this.moaId = nanoid();
  }

  @CreateDateColumn({ nullable: true })
  createDate?: Date;

  @UpdateDateColumn({ nullable: true })
  updateDate?: Date;

  @DeleteDateColumn({ nullable: true })
  deleteDate?: Date;

  @VersionColumn({ nullable: true })
  version?: number;

  /* Entity */
  /*
   * Moameta
   */

  @Column({ nullable: true, default: 0 })
  moaOrdinal?: number;

  @Column({ nullable: true, default: true })
  moaEnabled?: boolean;

  /*
   * Square
   */

  @Column({ nullable: true, unique: true })
  squareId?: string;

  @Column({ type: String, nullable: true })
  name?: string | null;

  @Column({ nullable: true })
  priceInCents?: number;

  @Column({ type: String, nullable: true })
  description?: string | null;

  /*
   * Category
   */

  @Column({ nullable: true })
  categoryMoaId?: string;

  @ManyToOne(() => MoaCategory, (category) => category.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  @ApiProperty()
  category?: MoaCategory;

  /*
   * Modifier lists
   */

  @ManyToMany(() => MoaModifierList, (entity) => entity.items, {
    nullable: true,
    eager: true,
  })
  @ApiProperty()
  modifierLists?: MoaModifierList[];

  /*
   * Variations
   */
  @OneToMany(() => MoaVariation, (entity) => entity.item, {
    nullable: true,
    eager: true,
  })
  @ApiProperty()
  variations?: MoaVariation[];
}
