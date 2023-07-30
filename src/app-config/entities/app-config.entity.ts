import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';
import { nanoid } from 'nanoid';
import { FileEntity } from 'src/files/entities/file.entity';
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
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { AppearanceEnum } from './appearance.enum';
import { ColorModeEnum } from './color-mode.enum';

@Entity('app_config')
export class AppConfig extends EntityHelper {
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

  @Transform(({ value }) => value ?? undefined)
  @ApiProperty({ required: false })
  @Column({ nullable: true })
  name?: string;

  @Transform(({ value }) => value ?? undefined)
  @ApiProperty({ required: false })
  @Column({ nullable: true })
  seedColor?: string;

  @Transform(({ value }) => value ?? undefined)
  @ApiProperty({ required: false })
  @Column({ nullable: true })
  fontFamily?: string;

  @ApiProperty({ required: false, enum: Object.values(AppearanceEnum) })
  @Column({ type: 'simple-enum', nullable: true, enum: AppearanceEnum })
  appearance?: AppearanceEnum;

  @ApiProperty({ required: false, enum: Object.values(ColorModeEnum) })
  @Column({ type: 'simple-enum', nullable: true, enum: ColorModeEnum })
  colorMode?: ColorModeEnum;

  @Transform(({ value }) => value ?? undefined)
  @ApiProperty({ required: false })
  @Column({ nullable: true })
  shortDescription?: string;

  @Transform(({ value }) => value ?? undefined)
  @ApiProperty({ required: false })
  @Column({ nullable: true })
  fullDescription?: string;

  @Transform(({ value }) => value ?? undefined)
  @ApiProperty({ required: false })
  @Column({ nullable: true })
  keywords?: string;

  @Transform(({ value }) => value ?? undefined)
  @ApiProperty({ required: false })
  @Column({ nullable: true })
  url?: string;

  @Transform(({ value }) => value ?? undefined)
  @ApiProperty({ required: false })
  @Column({ nullable: true })
  message?: string;

  @Transform(({ value }) => value ?? undefined)
  @ApiProperty({ required: false })
  @Column({ nullable: true })
  blockingMessage?: string;

  /* App Icon */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  iconFileId?: string;

  @OneToOne(() => FileEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'iconFileId' })
  iconFile?: FileEntity | null;

  // @ApiProperty({ required: false })
  // @Column({ nullable: true })
  // enabled?: boolean;

  /* Relations */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  merchantId?: string;

  @ManyToOne(() => Merchant, { onDelete: 'SET NULL' })
  @JoinColumn()
  merchant?: Merchant;
}
