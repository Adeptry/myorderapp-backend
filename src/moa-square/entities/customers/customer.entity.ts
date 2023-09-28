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
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { UserEntity } from '../../../users/entities/user.entity.js';
import { SquareCard } from '../../dto/square/square.dto.js';
import { LocationEntity } from '../locations/location.entity.js';
import { MerchantEntity } from '../merchants/merchant.entity.js';
import { OrderEntity } from '../orders/order.entity.js';
import { AppInstall } from './app-install.entity.js';

@Entity('customer')
export class CustomerEntity extends BaseEntity {
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
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user?: Relation<UserEntity>;

  /* Merchant */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  merchantId?: string;

  @ManyToOne(() => MerchantEntity, { onDelete: 'SET NULL' })
  merchant?: Relation<MerchantEntity>;

  /* Current order */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  currentOrderId?: string;

  @OneToOne(() => OrderEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'currentOrderId' })
  currentOrder?: Relation<OrderEntity> | null;

  /* Orders */

  @OneToMany(() => OrderEntity, (entity) => entity.customer, {
    nullable: true,
  })
  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  orders?: OrderEntity[];

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

  @ApiProperty({ type: () => LocationEntity, nullable: true, required: false })
  @ManyToOne(
    () => LocationEntity,
    (entity) => entity.variationLocationOverrides,
    {
      onDelete: 'SET NULL',
      nullable: false,
    },
  )
  @JoinColumn({ name: 'preferredLocationId' })
  preferredLocation?: Relation<LocationEntity> | null;

  /*
   * Preferred card
   */

  @ApiProperty({ required: false, nullable: true, type: String })
  @Column({ nullable: true, type: String })
  preferredSquareCardId?: string | null;

  @ApiProperty({ required: false, type: SquareCard, nullable: true })
  preferredSquareCard?: SquareCard;
}