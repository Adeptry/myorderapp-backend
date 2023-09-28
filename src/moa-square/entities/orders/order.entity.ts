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
import { FulfillmentStatusEnum } from '../../dto/square/square-order-fulfillment-updated.payload.js';
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