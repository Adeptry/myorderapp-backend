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
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { Item } from './item.entity';
import { ModifierList } from './modifier-list.entity';

@Entity('item_modifier_list')
export class ItemModifierList extends EntityHelper {
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
    type: () => Item,
    required: false,
    nullable: true,
  })
  @ManyToOne(() => Item, (item) => item.itemModifierLists, {
    onDelete: 'CASCADE',
  })
  item: Item;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: false })
  modifierListId?: string;

  @ApiProperty({
    type: () => ModifierList,
    required: false,
    nullable: true,
  })
  @ManyToOne(
    () => ModifierList,
    (modifierList) => modifierList.itemModifierLists,
    {
      onDelete: 'CASCADE',
    },
  )
  modifierList: ModifierList;
}
