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
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity.js';
import { AppConfigEntity } from './app-config.entity.js';
import { CatalogEntity } from './catalog.entity.js';
import { CustomerEntity } from './customer.entity.js';
import { LocationEntity } from './location.entity.js';

@Entity('merchant')
export class MerchantEntity extends BaseEntity {
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

  @ApiProperty({ type: Number, required: false, nullable: true })
  @Column({ type: Number, nullable: true, default: 15 })
  pickupLeadDurationMinutes?: number | null;

  /*
   * User
   */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  userId?: string;

  @ApiProperty({ type: () => UserEntity, required: false, nullable: true })
  @ManyToOne(() => UserEntity)
  user?: Relation<UserEntity>;

  /*
   * App config
   */

  @ApiProperty({ required: false, nullable: true, type: () => AppConfigEntity })
  @OneToOne(() => AppConfigEntity, (entity) => entity.merchant, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  appConfig?: Relation<AppConfigEntity>;

  /*
   * Square Oauth
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
   * Square merchant
   */

  @ApiProperty({
    required: false,
    nullable: true,
    description: "The name of the merchant's overall business.",
  })
  @Column({ nullable: true, type: String })
  squareBusinessName?: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'Indicates the country associated with another entity, such as a business. Values are in ISO 3166-1-alpha-2 format.',
  })
  @Column({ nullable: true, type: String })
  countryCode?: string;

  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'The code indicating the language preferences of the merchant, in [BCP 47 format](https://tools.ietf.org/html/bcp47#appendix-A). For example, `en-US` or `fr-CA`. ',
  })
  @Column({ nullable: true, type: String })
  languageCode?: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'Indicates the associated currency for an amount of money. Values correspond to ISO 4217.',
  })
  @Column({ nullable: true, type: String })
  currencyCode?: string;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true, type: String })
  squareStatus?: string;

  @Column({ nullable: true, type: String })
  @Exclude({ toPlainOnly: true })
  squareMainLocationId?: string | null;

  /*
   * Stripe
   */

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  stripeId?: string;

  /*
   * Catalog
   */

  @ApiProperty({ required: false, nullable: true, type: () => CatalogEntity })
  @OneToOne(() => CatalogEntity, (entity) => entity.merchant, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  catalog?: Relation<CatalogEntity>;

  /*
   * Locations
   */

  @OneToMany(() => LocationEntity, (entity) => entity.merchant, {
    nullable: true,
  })
  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  locations?: LocationEntity[];

  /*
   * Customers
   */

  @OneToMany(() => CustomerEntity, (entity) => entity.merchant, {
    nullable: true,
    onDelete: 'NO ACTION',
  })
  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  customers?: CustomerEntity[];

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
