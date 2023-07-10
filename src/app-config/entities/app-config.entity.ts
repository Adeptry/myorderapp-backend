import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { nanoid } from 'nanoid';
import { MoaMerchant } from 'src/merchants/entities/merchant.entity';
import { EntityHelper } from 'src/utils/entity-helper';
import {
  BeforeInsert,
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

@Entity('app_config')
export class AppConfig extends EntityHelper {
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

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  primaryColor?: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  secondaryColor?: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  fontFamily?: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  merchantId?: string;

  @ManyToOne(() => MoaMerchant, { onDelete: 'SET NULL' })
  @JoinColumn()
  merchant?: MoaMerchant;
}
