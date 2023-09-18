import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { nanoid } from 'nanoid';
import type { Relation } from 'typeorm';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { Location } from '../../locations/entities/location.entity.js';
import { Merchant } from '../../merchants/entities/merchant.entity.js';
import { Order } from '../../orders/entities/order.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { EntityHelper } from '../../utils/entity-helper.js';
import { AppInstall } from './app-install.entity.js';

@Entity('customer')
export class Customer extends EntityHelper {
  /* Base entity */

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

  /* User */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  userId?: string;

  @ApiProperty({ required: false, nullable: true })
  @ManyToOne(() => User)
  user?: Relation<User>;

  /* Merchant */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  merchantId?: string;

  @ManyToOne(() => Merchant)
  merchant?: Relation<Merchant>;

  /* Current order */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  currentOrderId?: string;

  @OneToOne(() => Order, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'currentOrderId' })
  currentOrder?: Relation<Order> | null;

  /* Orders */

  @OneToMany(() => Order, (entity) => entity.customer, {
    nullable: true,
  })
  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  orders?: Order[];

  /* Installs */

  @OneToMany(() => AppInstall, (entity) => entity.customer, {
    nullable: true,
  })
  appInstalls?: AppInstall[];

  /* Square */

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column('text', { nullable: true })
  squareId?: string | null;

  /*
   * Preferred location
   */

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  preferredLocationId?: string;

  @ApiProperty({ type: () => Location, nullable: true, required: false })
  @ManyToOne(() => Location, (entity) => entity.variationLocationOverrides, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'preferredLocationId' })
  preferredLocation?: Relation<Location> | null;
}
