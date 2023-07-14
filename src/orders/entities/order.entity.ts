import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { nanoid } from 'nanoid';
import { Customer } from 'src/customers/entities/customer.entity';
import { Location } from 'src/locations/entities/location.entity';
import { Merchant } from 'src/merchants/entities/merchant.entity';
import { SquareOrder } from 'src/square/square.dto';
import { EntityHelper } from 'src/utils/entity-helper';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

@Entity('order')
export class Order extends EntityHelper {
  @ApiProperty({ required: false })
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

  /* Customer */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  customerId?: string;

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

  @ManyToOne(() => Location, { onDelete: 'SET NULL' })
  @JoinColumn()
  location?: Location;

  /* Square */

  @ApiProperty()
  squareDetails?: SquareOrder;

  @ApiHideProperty()
  @Exclude()
  @Column({ nullable: true })
  squareId?: string;

  @ApiHideProperty()
  @Exclude()
  @Column({})
  squareVersion: number;
}
