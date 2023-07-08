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

import { nanoid } from 'nanoid';
import { EntityHelper } from 'src/utils/entity-helper';
import { MoaModifierList } from './modifier-list.entity';

@Entity('modifier')
export class MoaModifier extends EntityHelper {
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
  @Column({ nullable: true, unique: true })
  squareId?: string;

  @Column({ type: String, nullable: true })
  name?: string | null;

  @Column({ nullable: true })
  priceInCents?: number;

  @Column({ type: String, nullable: true })
  ordinal?: number | null;

  @ManyToOne(() => MoaModifierList, (entity) => entity.modifiers, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  @ApiProperty()
  modifierList?: MoaModifierList;
}
