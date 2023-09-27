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
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { LineItemModifierEntity } from './line-item-modifier.entity.js';
import { OrderEntity } from './order.entity.js';

@Entity('line_item')
export class LineItemEntity extends BaseEntity {
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

  /* Square info */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true, unique: true })
  squareUid?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  name?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  quantity?: string;

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  note?: string; // | null;

  // @ApiProperty({ required: false, nullable: true })
  // @Column({ nullable: true })
  // variationId?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  variationName?: string; // | null;

  @ApiProperty({ type: String, nullable: true, required: false })
  @Column({ nullable: true })
  currency?: string;

  @ApiProperty({ type: Number, nullable: true, required: false })
  @Column({ nullable: true })
  basePriceMoney?: number;

  @ApiProperty({ type: Number, nullable: true, required: false })
  @Column({ nullable: true })
  variationTotalMoneyAmount?: number;

  @ApiProperty({ type: Number, nullable: true, required: false })
  @Column({ nullable: true })
  grossSalesMoneyAmount?: number;

  @ApiProperty({ type: Number, nullable: true, required: false })
  @Column({ nullable: true })
  totalTaxMoneyAmount?: number;

  @ApiProperty({ type: Number, nullable: true, required: false })
  @Column({ nullable: true })
  totalDiscountMoneyAmount?: number;

  @ApiProperty({ type: Number, nullable: true, required: false })
  @Column({ nullable: true })
  totalMoneyAmount?: number;

  @ApiProperty({ type: Number, nullable: true, required: false })
  @Column({ nullable: true })
  totalServiceChargeMoneyAmount?: number;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  orderId?: string;

  @ManyToOne(() => OrderEntity, (entity) => entity.lineItems, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order?: Relation<OrderEntity>;

  @ApiProperty({
    required: false,
    type: () => LineItemModifierEntity,
    isArray: true,
    nullable: true,
  })
  @OneToMany(() => LineItemModifierEntity, (entity) => entity.lineItem, {
    nullable: true,
    cascade: true,
  })
  modifiers?: LineItemModifierEntity[];
}
