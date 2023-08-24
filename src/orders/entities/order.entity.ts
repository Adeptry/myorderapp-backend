import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { nanoid } from 'nanoid';
import { Customer } from 'src/customers/entities/customer.entity';
import { Location } from 'src/locations/entities/location.entity';
import { Merchant } from 'src/merchants/entities/merchant.entity';
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
import { LineItem } from './line-item.entity';

@Entity('order')
export class Order extends EntityHelper {
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
    type: () => Customer,
    nullable: true,
  })
  @ManyToOne(() => Customer, (entity) => entity.orders, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  customer?: Customer;

  /*
   * Merchant
   */

  @Column({ nullable: true })
  merchantId?: string;

  @ManyToOne(() => Merchant, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  merchant?: Merchant;

  /*
   * Location
   */

  @Column({})
  locationId: string;

  @ApiProperty({
    required: false,
    type: () => Location,
    nullable: true,
  })
  @ManyToOne(() => Location, { onDelete: 'SET NULL' })
  @JoinColumn()
  location?: Location;

  /*
   * Square
   */

  @ApiProperty({
    required: false,
    type: () => [LineItem],
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
  @Column({})
  squareVersion: number;

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
  moneyAmount?: number;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ nullable: true })
  moneyTaxAmount?: number;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ nullable: true })
  moneyDiscountAmount?: number;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ nullable: true })
  moneyTipAmount?: number;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ nullable: true })
  moneyServiceChargeAmount?: number;
}
