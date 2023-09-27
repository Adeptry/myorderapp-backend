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
import { CustomerEntity } from '../customers/customer.entity.js';
import { LocationEntity } from '../locations/location.entity.js';
import { MerchantEntity } from '../merchants/merchant.entity.js';
import { LineItemEntity } from './line-item.entity.js';

@Entity('order')
export class OrderEntity extends BaseEntity {
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
    type: () => CustomerEntity,
    nullable: true,
  })
  @ManyToOne(() => CustomerEntity, (entity) => entity.orders, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn()
  customer?: Relation<CustomerEntity>;

  /*
   * Merchant
   */

  @Column({ nullable: true })
  merchantId?: string;

  @ManyToOne(() => MerchantEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  merchant?: Relation<MerchantEntity>;

  /*
   * Location
   */

  @Column({ type: String, nullable: true })
  locationId?: string;

  @ApiProperty({
    required: false,
    type: () => LocationEntity,
    nullable: true,
  })
  @ManyToOne(() => LocationEntity, { onDelete: 'SET NULL' })
  @JoinColumn()
  location?: Relation<LocationEntity>;

  /*
   * Square
   */

  @ApiProperty({
    required: false,
    type: () => LineItemEntity,
    isArray: true,
    nullable: true,
  })
  @OneToMany(() => LineItemEntity, (entity) => entity.order, {
    nullable: true,
    cascade: true,
  })
  lineItems?: LineItemEntity[];

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
