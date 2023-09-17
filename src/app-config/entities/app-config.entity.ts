import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { nanoid } from 'nanoid';
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
  Relation,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { FileEntity } from '../../files/entities/file.entity.js';
import { Merchant } from '../../merchants/entities/merchant.entity.js';
import { EntityHelper } from '../../utils/entity-helper.js';
import { ThemeModeEnum } from './theme-mode.enum.js';

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
    required: false,
    nullable: true,
  })
  @OneToOne(() => FileEntity, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'iconFileId' })
  iconFile?: Relation<FileEntity> | null;

  // @ApiProperty({ required: false, nullable: true })
  // @Column({ nullable: true })
  // enabled?: boolean;

  /* Relations */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  merchantId?: string;

  @ManyToOne(() => Merchant, (entity) => entity.appConfig, {
    onDelete: 'SET NULL',
  })
  @JoinColumn()
  merchant?: Relation<Merchant>;
}
