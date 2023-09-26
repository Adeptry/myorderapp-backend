import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
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
import { Customer } from '../../customers/entities/customer.entity.js';
import { Location } from '../../locations/entities/location.entity.js';
import { Merchant } from '../../merchants/entities/merchant.entity.js';
import { LineItem } from './line-item.entity.js';

@Entity('order')
export class Order extends BaseEntity {
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

  /*
   * Customer
   */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  customerId?: string;

  @ApiProperty({
    required: false,
    type: 'Customer',
    nullable: true,
  })
  @ManyToOne(() => Customer, (entity) => entity.orders, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn()
  customer?: Relation<Customer>;

  /*
   * Merchant
   */

  @Column({ nullable: true })
  merchantId?: string;

  @ManyToOne(() => Merchant, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  merchant?: Relation<Merchant>;

  /*
   * Location
   */

  @Column({ type: String, nullable: true })
  locationId?: string;

  @ApiProperty({
    required: false,
    type: 'Location',
    nullable: true,
  })
  @ManyToOne(() => Location, { onDelete: 'SET NULL' })
  @JoinColumn()
  location?: Relation<Location>;

  /*
   * Square
   */

  @ApiProperty({
    required: false,
    type: () => LineItem,
    isArray: true,
    nullable: true,
  })
  @OneToMany(() => LineItem, (entity) => entity.order, {
    nullable: true,
    cascade: true,
  })
  lineItems?: LineItem[];

  @ApiHideProperty()
  @Exclude()
  @Column({ nullable: true })
  squareId?: string;

  @ApiHideProperty()
  @Exclude()
  @Column({ type: Number, nullable: true })
  squareVersion?: number;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ type: Date, nullable: true })
  closedAt?: Date;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
  })
  @Column({ type: String, nullable: true })
  currency?: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ nullable: true })
  totalMoneyAmount?: number;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ nullable: true })
  totalMoneyTaxAmount?: number;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ nullable: true })
  totalMoneyDiscountAmount?: number;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ nullable: true })
  totalMoneyTipAmount?: number;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ nullable: true })
  totalMoneyServiceChargeAmount?: number;
}
