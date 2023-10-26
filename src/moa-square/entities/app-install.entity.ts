import { ApiProperty } from '@nestjs/swagger';
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
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { CustomerEntity } from './customer.entity.js';

@Entity('app_install')
export class AppInstallEntity extends BaseEntity {
  /* Base entity */

  @PrimaryColumn('varchar')
  @Exclude({ toPlainOnly: true })
  id?: string;

  @BeforeInsert()
  setId() {
    this.id = nanoid();
  }

  @CreateDateColumn({ nullable: true })
  @Exclude({ toPlainOnly: true })
  createDate?: Date;

  @UpdateDateColumn({ nullable: true })
  @Exclude({ toPlainOnly: true })
  updateDate?: Date;

  @DeleteDateColumn({ nullable: true })
  @Exclude({ toPlainOnly: true })
  deleteDate?: Date;

  @VersionColumn({ nullable: true })
  @Exclude({ toPlainOnly: true })
  version?: number;

  /* Firebase */

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    example: '123456789',
  })
  @Column({ nullable: true })
  firebaseInstallationId?: string;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
    example: nanoid(),
  })
  @Column({ nullable: true })
  firebaseCloudMessagingToken?: string;

  /* Customer */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  customerId?: string;

  @ManyToOne(() => CustomerEntity, (entity) => entity.appInstalls, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customerId' })
  customer?: Relation<CustomerEntity>;
}
