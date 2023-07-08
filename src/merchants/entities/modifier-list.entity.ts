import { ApiProperty } from '@nestjs/swagger';
import { nanoid } from 'nanoid';
import { EntityHelper } from 'src/utils/entity-helper';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { MoaSelectionType } from '../dto/catalogs.types';
import { MoaItem } from './item.entity';
import { MoaModifier } from './modifier.entity';

@Entity('modifier_list')
export class MoaModifierList extends EntityHelper {
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

  @Column({ type: Number, nullable: true })
  minSelectedModifiers?: number | null;

  @Column({ type: Number, nullable: true })
  maxSelectedModifiers?: number | null;

  @Column({ type: Boolean, nullable: true })
  enabled?: boolean | null;

  @Column({ type: String, nullable: true })
  name?: string | null;

  @Column({ type: 'simple-enum', nullable: true, enum: MoaSelectionType })
  selectionType?: MoaSelectionType;

  @ManyToMany(() => MoaItem, (entity) => entity.modifierLists, {
    onDelete: 'CASCADE',
    nullable: true,
    cascade: true,
  })
  @JoinTable()
  @ApiProperty()
  items?: MoaItem[];

  @OneToMany(() => MoaModifier, (entity) => entity.modifierList, {
    nullable: true,
    eager: true,
  })
  @ApiProperty()
  modifiers?: MoaModifier[];
}
