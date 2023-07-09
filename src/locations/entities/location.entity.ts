import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { nanoid } from 'nanoid';
import { EntityHelper } from 'src/utils/entity-helper';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { MoaMerchant } from '../../merchants/entities/merchant.entity';

@Entity('location')
export class MoaLocation extends EntityHelper {
  @ApiProperty({ required: false })
  @PrimaryColumn('varchar')
  moaId?: string;

  @BeforeInsert()
  setMoaId() {
    this.moaId = nanoid();
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
   * Moameta
   */

  @ApiProperty({ required: false })
  @Column({ nullable: true, default: 0 })
  moaOrdinal?: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true, default: true })
  moaEnabled?: boolean;

  /* Square */
  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  name?: string | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  description?: string | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  phoneNumber?: string | null;

  @ApiProperty({ type: Number, required: false })
  @Column({ type: Number, nullable: true })
  latitude?: number | null;

  @ApiProperty({ type: Number, required: false })
  @Column({ type: Number, nullable: true })
  longitude?: number | null;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  status?: string | null;

  // businessHours?: BusinessHours;
  // timezone?: string;
  // capabilities?: string[];
  // taxIds?: TaxIds;

  @ApiProperty({ type: String, required: false })
  @Column({ type: String, nullable: true })
  address?: string | null;

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

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  merchantMoaId?: string;

  @ManyToOne(() => MoaMerchant, { onDelete: 'SET NULL' })
  merchant?: MoaMerchant;

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
