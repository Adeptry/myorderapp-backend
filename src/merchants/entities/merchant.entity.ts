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
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { AppConfig } from '../../app-config/entities/app-config.entity.js';
import { Catalog } from '../../catalogs/entities/catalog.entity.js';
import { Customer } from '../../customers/entities/customer.entity.js';
import { Location } from '../../locations/entities/location.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { EntityHelper } from '../../utils/entity-helper.js';

@Entity('merchant')
export class Merchant extends EntityHelper {
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

  @ApiProperty({ type: Number, required: false, nullable: true })
  @Column({ type: Number, nullable: true })
  tier?: number | null;

  /*
   * User
   */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  userId?: string;

  @ApiProperty({ type: () => User, required: false, nullable: true })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user?: Relation<User>;

  /*
   * App config
   */

  @ApiProperty({ required: false, nullable: true, type: () => AppConfig })
  @OneToOne(() => AppConfig, (entity) => entity.merchant, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  appConfig?: Relation<AppConfig>;

  /*
   * Square
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

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  squareId?: string;

  /*
   * Stripe
   */

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  stripeId?: string;

  /*
   * Catalog
   */

  @ApiProperty({ required: false, nullable: true, type: () => Catalog })
  @OneToOne(() => Catalog, (entity) => entity.merchant, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  catalog?: Relation<Catalog>;

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
