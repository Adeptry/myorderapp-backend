import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
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
import { FulfillmentStatusEnum } from '../dto/square/square-order-fulfillment-updated.payload.js';
import { CustomerEntity } from './customer.entity.js';
import { LineItemEntity } from './line-item.entity.js';
import { LocationEntity } from './location.entity.js';
import { MerchantEntity } from './merchant.entity.js';

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

  @ApiProperty({
    required: false,
    nullable: true,
    enum: Object.values(FulfillmentStatusEnum),
    enumName: 'FulfillmentStatusEnum',
  })
  @Column({
    type: 'simple-enum',
    nullable: true,
    enum: FulfillmentStatusEnum,
    default: FulfillmentStatusEnum.proposed,
  })
  squareFulfillmentStatus?: FulfillmentStatusEnum;

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
  closedDate?: Date;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ type: Date, nullable: true })
  pickupDate?: Date;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ default: 0 })
  totalMoneyAmount!: number;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ default: 0 })
  totalTaxMoneyAmount!: number;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ default: 0 })
  totalDiscountMoneyAmount!: number;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ default: 0 })
  totalTipMoneyAmount!: number;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ default: 0 })
  totalServiceChargeMoneyAmount!: number;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ default: 0 })
  appFeeMoneyAmount!: number;

  @Expose()
  @ApiProperty({ required: false, type: Number, nullable: true })
  get subtotalMoneyAmount(): number {
    return this.totalMoneyAmount - this.totalTaxMoneyAmount;
  }

  @Expose()
  @ApiProperty({ required: false, type: String, nullable: true })
  get displayId(): string | undefined {
    return (this.squareId?.length ?? 0) > 8
      ? this.squareId?.slice(0, 8).toUpperCase()
      : (this.id?.length ?? 0) > 8
      ? this.id?.slice(0, 8).toUpperCase()
      : undefined;
  }
}
