import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { nanoid } from 'nanoid';
import { ModifierLocationOverride } from 'src/catalogs/entities/modifier-location-override.entity';
import { VariationLocationOverride } from 'src/catalogs/entities/variation-location-override.entity';
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
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { Address } from './address.entity';
import { BusinessHoursPeriod } from './business-hours-period.entity';

@Entity('location')
export class Location extends EntityHelper {
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

  /*
   * Moa
   */

  @ApiProperty({ required: false })
  @Column({ nullable: true, default: 0 })
  moaOrdinal?: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true, default: true })
  moaEnabled?: boolean;

  /*
   * Square
   */
  @ApiProperty({ type: Boolean, required: true })
  @Column({ type: Boolean, nullable: true, default: false })
  isMain?: boolean;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  name?: string | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  description?: string | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  phoneNumber?: string | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  status?: string | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  timezone?: string | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  country?: string | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  languageCode?: string | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  currency?: string | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  businessName?: string | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  type?: string | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  websiteUrl?: string | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  businessEmail?: string | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  twitterUsername?: string | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  instagramUsername?: string | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  facebookUrl?: string | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  logoUrl?: string | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  posBackgroundUrl?: string;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  mcc?: string | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  fullFormatLogoUrl?: string | null;

  /*
   * Merchant
   */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  merchantId?: string;

  @ManyToOne(() => Merchant, (entity) => entity.locations, {
    onDelete: 'SET NULL',
  })
  merchant?: Merchant;

  /*
   * Business Hours
   */

  @OneToMany(() => BusinessHoursPeriod, (entity) => entity.location, {
    nullable: true,
  })
  @ApiProperty({ type: BusinessHoursPeriod, required: false, isArray: true })
  businessHours?: BusinessHoursPeriod[];

  /*
   * Address
   */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  addressId?: string;

  @OneToOne(() => Address, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'addressId' })
  @ApiProperty({ type: Address, required: false })
  address?: Address | null;

  /*
   * Overrides
   */

  @OneToMany(() => VariationLocationOverride, (entity) => entity.location, {
    nullable: true,
  })
  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  variationLocationOverrides?: VariationLocationOverride[];

  @OneToMany(() => ModifierLocationOverride, (entity) => entity.location, {
    nullable: true,
  })
  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  modifierLocationOverrides?: ModifierLocationOverride[];

  /*
   * Square
   */

  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  @Column({ nullable: true })
  merchantSquareId?: string;

  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  @Column({ nullable: true, unique: true })
  locationSquareId?: string;
}
