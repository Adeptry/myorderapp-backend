import { ApiHideProperty } from '@nestjs/swagger';
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
  @PrimaryColumn('varchar')
  moaId?: string;

  @BeforeInsert()
  setMoaId() {
    this.moaId = nanoid();
  }

  @CreateDateColumn({ nullable: true })
  createDate?: Date;

  @UpdateDateColumn({ nullable: true })
  updateDate?: Date;

  @DeleteDateColumn({ nullable: true })
  deleteDate?: Date;

  @VersionColumn({ nullable: true })
  version?: number;

  /*
   * Moameta
   */

  @Column({ nullable: true, default: 0 })
  moaOrdinal?: number;

  @Column({ nullable: true, default: true })
  moaEnabled?: boolean;

  /* Square */
  @Column({ type: String, nullable: true })
  name?: string | null;

  @Column({ type: String, nullable: true })
  description?: string | null;

  @Column({ type: String, nullable: true })
  phoneNumber?: string | null;

  @Column({ type: Number, nullable: true })
  latitude?: number | null;

  @Column({ type: Number, nullable: true })
  longitude?: number | null;

  @Column({ type: String, nullable: true })
  status?: string | null;

  // businessHours?: BusinessHours;
  // timezone?: string;
  // capabilities?: string[];
  // taxIds?: TaxIds;

  @Column({ type: String, nullable: true })
  address?: string | null;

  @Column({ type: String, nullable: true })
  country?: string | null;

  @Column({ type: String, nullable: true })
  languageCode?: string | null;

  @Column({ type: String, nullable: true })
  currency?: string | null;

  @Column({ type: String, nullable: true })
  businessName?: string | null;

  @Column({ type: String, nullable: true })
  type?: string | null;

  @Column({ type: String, nullable: true })
  websiteUrl?: string | null;

  @Column({ type: String, nullable: true })
  businessEmail?: string | null;

  @Column({ type: String, nullable: true })
  twitterUsername?: string | null;

  @Column({ type: String, nullable: true })
  instagramUsername?: string | null;

  @Column({ type: String, nullable: true })
  facebookUrl?: string | null;

  @Column({ type: String, nullable: true })
  logoUrl?: string | null;

  @Column({ type: String, nullable: true })
  posBackgroundUrl?: string;

  @Column({ type: String, nullable: true })
  mcc?: string | null;

  @Column({ type: String, nullable: true })
  fullFormatLogoUrl?: string | null;

  /*
   * Merchant
   */

  @Column({ nullable: true })
  merchantMoaId?: string;

  @ManyToOne(() => MoaMerchant, { onDelete: 'SET NULL' })
  merchant?: MoaMerchant;

  /*
   * Square
   */

  @Exclude()
  @ApiHideProperty()
  @Column({ nullable: true })
  merchantSquareId?: string;

  @Exclude()
  @ApiHideProperty()
  @Column({ nullable: true, unique: true })
  locationSquareId?: string;
}
