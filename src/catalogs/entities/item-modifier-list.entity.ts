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
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { Item } from './item.entity.js';
import { ModifierList } from './modifier-list.entity.js';

@Entity('item_modifier_list')
export class ItemModifierList extends BaseEntity {
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

  @ApiProperty({ type: Number, required: false, nullable: true })
  @Column({ type: Number, nullable: true })
  minSelectedModifiers?: number | null;

  @ApiProperty({ type: Number, required: false, nullable: true })
  @Column({ type: Number, nullable: true })
  maxSelectedModifiers?: number | null;

  @ApiProperty({ type: Boolean, required: false, nullable: true })
  @Column({ type: Boolean, nullable: true })
  enabled?: boolean | null;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: false })
  itemId?: string;

  @ApiProperty({
    type: 'Item',
    required: false,
    nullable: true,
  })
  @ManyToOne(() => Item, (entity) => entity.itemModifierLists, {
    onDelete: 'CASCADE',
  })
  item?: Relation<Item>;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: false })
  modifierListId?: string;

  @ApiProperty({
    type: () => ModifierList,
    required: false,
    nullable: true,
  })
  @ManyToOne(() => ModifierList, (entity) => entity.itemModifierLists, {
    onDelete: 'CASCADE',
  })
  modifierList?: Relation<ModifierList>;
}
