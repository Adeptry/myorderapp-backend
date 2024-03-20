/*
    This code is part of myorderapp-backend, a multi-tenant Square-based CMS.
    Copyright (C) 2024  Adeptry, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>
 */

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
  title?: string;

  @ApiProperty({ required: false, type: String, nullable: true })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({ required: false, type: Boolean, nullable: true })
  @Column({ nullable: true })
  useAdaptiveScaffold?: boolean;

  @ApiProperty({ type: Number, nullable: true, required: false })
  @Column({ nullable: true, default: 7 })
  categoryCollapseThreshold?: number;

  @ApiProperty({
    required: false,
    nullable: true,
    type: Boolean,
  })
  @Column({ nullable: true, default: false })
  preferRelatedApplications?: boolean;

  @ApiProperty({ required: false, type: String, nullable: true })
  @Column({ nullable: true })
  playAppUrl?: string;

  @ApiProperty({ required: false, type: String, nullable: true })
  @Column({ nullable: true })
  playAppId?: string;

  @ApiProperty({ required: false, type: String, nullable: true })
  @Column({ nullable: true })
  itunesUrl?: string;

  @ApiProperty({ required: false, type: String, nullable: true })
  @Column({ nullable: true })
  itunesId?: string;

  /* App Icon */

  @Column({ nullable: true })
  iconFileKey?: string;

  @ApiProperty({ required: false, type: String, nullable: true })
  @Column({ nullable: true })
  iconFileDisplayName?: string;

  @ApiProperty({ required: false, type: String, nullable: true })
  @Column({ nullable: true })
  iconFileFullUrl?: string;

  @ApiProperty({ required: false, type: String, nullable: true })
  @Column({ nullable: true })
  iconFileContentType?: string;

  @ApiProperty({ required: false, type: String, nullable: true })
  @Column({ nullable: true })
  iconFileSize?: string;

  /* App Banner */

  @Column({ nullable: true })
  bannerFileKey?: string;

  @ApiProperty({ required: false, type: String, nullable: true })
  @Column({ nullable: true })
  bannerFileDisplayName?: string;

  @ApiProperty({ required: false, type: String, nullable: true })
  @Column({ nullable: true })
  bannerFileFullUrl?: string;

  @ApiProperty({ required: false, type: String, nullable: true })
  @Column({ nullable: true })
  bannerFileContentType?: string;

  /* Relations */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  merchantId?: string;

  @ManyToOne(() => MerchantEntity, (entity) => entity.appConfig, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'merchantId' })
  merchant?: Relation<MerchantEntity>;
}
