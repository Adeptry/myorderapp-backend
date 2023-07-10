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

  @ManyToMany(() => MoaItem, (entity) => entity.modifierLists, {
    onDelete: 'CASCADE',
    nullable: true,
    cascade: true,
  })
  @JoinTable()
  items?: MoaItem[];

  @ApiProperty({ type: () => MoaModifier, isArray: true, required: false })
  @OneToMany(() => MoaModifier, (entity) => entity.modifierList, {
    nullable: true,
    eager: true,
  })
  modifiers?: MoaModifier[];
}
