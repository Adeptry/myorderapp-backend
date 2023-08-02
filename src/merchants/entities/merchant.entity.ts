import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { nanoid } from 'nanoid';
import { AppConfig } from 'src/app-config/entities/app-config.entity';
import { Catalog } from 'src/catalogs/entities/catalog.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { Location } from 'src/locations/entities/location.entity';
import { User } from 'src/users/entities/user.entity';
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
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

@Entity('merchant')
export class Merchant extends EntityHelper {
  /* Base entity */

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

  /* Step 1: User */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  userId?: string;

  @ApiProperty({ required: false })
  @ManyToOne(() => User)
  user?: User;

  /*
   * Step 2: App config
   */

  @OneToOne(() => AppConfig, (entity) => entity.merchant, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  appConfig?: AppConfig;

  /*
   * Step 3: Square
   */

  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  @Column({ nullable: true })
  squareAccessToken?: string;

  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  @Column({ nullable: true })
  squareRefreshToken?: string;

  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  @Column({ nullable: true })
  squareExpiresAt?: Date;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  squareId?: string;

  /*
   * Step 4: Checkout
   */

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  stripeId?: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  stripeCheckoutSessionId?: string;

  /*
   * Catalog
   */

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  catalogId?: string;

  @ApiHideProperty()
  @Exclude({ toPlainOnly: true })
  @OneToOne(() => Catalog, (entity) => entity.merchant, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'catalogId' })
  catalog?: Catalog;

  /*
   * Locations
   */

  @OneToMany(() => Location, (entity) => entity.merchant, {
    nullable: true,
  })
  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  locations?: Location[];

  /*
   * Customers
   */

  @OneToMany(() => Customer, (entity) => entity.merchant, {
    nullable: true,
  })
  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  customers?: Customer[];

  /*
   * Firebase
   */

  @Exclude({ toPlainOnly: true })
  @Column('simple-json', { nullable: true })
  firebaseAppOptions?: Record<string, any>;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  firebaseDatabaseUrl?: string;
}
