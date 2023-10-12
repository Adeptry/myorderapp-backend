import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { nanoid } from 'nanoid';
import type { Relation } from 'typeorm';
import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
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
import { MerchantEntity } from './merchant.entity.js';
import { ThemeModeEnum } from './theme-mode.enum.js';

@Entity('app_config')
export class AppConfigEntity extends BaseEntity {
  /* Base entity */
  @Exclude({ toPlainOnly: true })
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

  /* App config entity */

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true, unique: true })
  name?: string;

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true, unique: true })
  path?: string;

  @BeforeUpdate()
  @BeforeInsert()
  setPathComponent() {
    let processedPathComponent = this.name?.toLowerCase();

    // Remove leading and trailing whitespace
    processedPathComponent = processedPathComponent?.trim();

    // Replace spaces with hyphens
    processedPathComponent = processedPathComponent?.replace(/\s+/g, '-');

    // Remove all non-alphanumeric and non-hyphen characters
    processedPathComponent = processedPathComponent?.replace(
      /[^a-zA-Z0-9-]/g,
      '',
    );

    this.path = processedPathComponent;
  }

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ nullable: true, default: true })
  enabled?: boolean;

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  seedColor?: string;

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  fontFamily?: string;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ nullable: true })
  useMaterial3?: boolean;

  @ApiProperty({
    required: false,
    nullable: true,
    enum: Object.values(ThemeModeEnum),
    enumName: 'ThemeModeEnum',
    default: ThemeModeEnum.system,
  })
  @Column({ type: 'simple-enum', nullable: true, enum: ThemeModeEnum })
  themeMode?: ThemeModeEnum;

  @ApiProperty({ required: false, type: String, nullable: true })
  @Column({ nullable: true })
  description?: string;

  /* App Icon */

  @Column({ nullable: true })
  iconFileKey?: string;

  @ApiProperty({ required: false, type: String, nullable: true })
  @Column({ nullable: true })
  iconFileDisplayName?: string;

  @ApiProperty({ required: false, type: String, nullable: true })
  @Column({ nullable: true })
  iconFileFullUrl?: string;

  /* Favicon */

  @Column({ nullable: true })
  faviconFileKey?: string;

  @ApiProperty({ required: false, type: String, nullable: true })
  @Column({ nullable: true })
  faviconFileDisplayName?: string;

  @ApiProperty({ required: false, type: String, nullable: true })
  @Column({ nullable: true })
  faviconFileFullUrl?: string;

  /* Relations */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  merchantId?: string;

  @ManyToOne(() => MerchantEntity, (entity) => entity.appConfig, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  merchant?: Relation<MerchantEntity>;
}
