import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
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
import { ThemeModeEnum } from './theme-mode.enum';

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

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ nullable: true })
  showsAds?: boolean;

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  name?: string;

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

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  message?: string;

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  blockingMessage?: string;

  @ApiProperty({ required: false, nullable: true })
  @Column({ nullable: true })
  minimumVersion?: string;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({ nullable: true })
  showAds?: boolean;

  /* App Icon */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  iconFileId?: string;

  @ApiProperty({
    type: () => FileEntity,
    isArray: true,
    required: false,
    nullable: true,
  })
  @OneToOne(() => FileEntity, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'iconFileId' })
  iconFile?: FileEntity | null;

  // @ApiProperty({ required: false, nullable: true })
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
