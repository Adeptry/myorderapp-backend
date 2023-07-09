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
import { MoaModifierList } from './modifier-list.entity';

@Entity('modifier')
export class MoaModifier extends EntityHelper {
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
  @ApiProperty({ required: false })
  @Column({ nullable: true, unique: true })
  squareId?: string;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  name?: string | null;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  priceInCents?: number;

  @ApiProperty({ type: Number, required: false })
  @Column({ type: Number, nullable: true })
  ordinal?: number | null;

  @ApiProperty({ required: false })
  @Column({ nullable: true, unique: true })
  modifierListId?: string;

  @ManyToOne(() => MoaModifierList, (entity) => entity.modifiers, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  modifierList?: MoaModifierList;
}
