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
import { AddressEntity } from './address.entity.js';
import { BusinessHoursPeriodEntity } from './business-hours-period.entity.js';
import { CustomerEntity } from './customer.entity.js';
import { MerchantEntity } from './merchant.entity.js';
import { ModifierLocationOverrideEntity } from './modifier-location-override.entity.js';
import { VariationLocationOverride } from './variation-location-override.entity.js';

@Entity('location')
export class LocationEntity extends BaseEntity {
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
   * Moa
   */
  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true, default: 0 })
  moaOrdinal?: number;

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true, default: true })
  moaEnabled?: boolean;

  /*
   * Square
   */
  @ApiProperty({ type: Boolean, required: true })
  @Column({ type: Boolean, nullable: true, default: false })
  isMain?: boolean;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  name?: string | null;

  @ApiProperty({ type: Number, required: false, nullable: true })
  @Column({ type: Number, nullable: true })
  latitude?: number | null;

  @ApiProperty({ type: Number, required: false, nullable: true })
  @Column({ type: Number, nullable: true })
  longitude?: number | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  description?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  phoneNumber?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  status?: string | null;

  /**
   * The [IANA time zone](https://www.iana.org/time-zones) identifier for
   * the time zone of the location. For example, `America/Los_Angeles`.
   */
  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  timezone?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  country?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  languageCode?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  currency?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  businessName?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  type?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  websiteUrl?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  businessEmail?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  twitterUsername?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  instagramUsername?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  facebookUrl?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  logoUrl?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  posBackgroundUrl?: string;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  mcc?: string | null;

  @ApiProperty({ type: String, required: false, nullable: true })
  @Column({ type: String, nullable: true })
  fullFormatLogoUrl?: string | null;

  /*
   * Merchant
   */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  merchantId?: string;

  @ManyToOne(() => MerchantEntity, (entity) => entity.locations, {
    onDelete: 'CASCADE',
  })
  merchant?: Relation<MerchantEntity>;

  /*
   * Merchant
   */

  @OneToMany(() => CustomerEntity, (entity) => entity.preferredLocation, {
    nullable: true,
    onDelete: 'NO ACTION',
  })
  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  preferredByCustomers?: CustomerEntity[];

  /*
   * Business Hours
   */

  @OneToMany(() => BusinessHoursPeriodEntity, (entity) => entity.location, {
    nullable: true,
  })
  @ApiProperty({
    type: BusinessHoursPeriodEntity,
    required: false,
    isArray: true,
    nullable: true,
  })
  businessHours?: BusinessHoursPeriodEntity[];

  /*
   * Address
   */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  addressId?: string;

  @OneToOne(() => AddressEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'addressId' })
  @ApiProperty({ type: AddressEntity, required: false, nullable: true })
  address?: Relation<AddressEntity> | null;

  /*
   * Overrides
   */

  @OneToMany(() => VariationLocationOverride, (entity) => entity.location, {
    nullable: true,
  })
  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  variationLocationOverrides?: VariationLocationOverride[];

  @OneToMany(
    () => ModifierLocationOverrideEntity,
    (entity) => entity.location,
    {
      nullable: true,
    },
  )
  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  modifierLocationOverrides?: ModifierLocationOverrideEntity[];

  /*
   * Square
   */

  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  @Column({ nullable: true })
  merchantSquareId?: string;

  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  @Column({ nullable: true })
  squareId?: string;
}
