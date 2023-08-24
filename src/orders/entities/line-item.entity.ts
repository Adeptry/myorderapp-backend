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
import { LineItemModifier } from './line-item-modifier.entity';
import { Order } from './order.entity';

@Entity('line_item')
export class LineItem extends EntityHelper {
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
  @Column({ nullable: true })
  squareUid?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  name?: string; // | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  quantity: string;

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
  variationTotalPriceMoney?: number;

  @ApiProperty({ type: Number, nullable: true, required: false })
  @Column({ nullable: true })
  grossSalesMoney?: number;

  @ApiProperty({ type: Number, nullable: true, required: false })
  @Column({ nullable: true })
  totalTaxMoney?: number;

  @ApiProperty({ type: Number, nullable: true, required: false })
  @Column({ nullable: true })
  totalDiscountMoney?: number;

  @ApiProperty({ type: Number, nullable: true, required: false })
  @Column({ nullable: true })
  totalMoney?: number;

  @ApiProperty({ type: Number, nullable: true, required: false })
  @Column({ nullable: true })
  totalServiceChargeMoney?: number;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  orderId?: string;

  @ManyToOne(() => Order, (entity) => entity.lineItems, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order?: Order;

  @ApiProperty({
    required: false,
    type: () => LineItemModifier,
    isArray: true,
    nullable: true,
  })
  @OneToMany(() => LineItemModifier, (entity) => entity.lineItem, {
    nullable: true,
    cascade: true,
  })
  modifiers?: LineItemModifier[];
}
