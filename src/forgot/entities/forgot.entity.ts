import { Exclude } from 'class-transformer';
import { Allow } from 'class-validator';
import { nanoid } from 'nanoid';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { EntityHelper } from '../../utils/entity-helper.js';

@Entity()
export class Forgot extends EntityHelper {
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

  @Allow()
  @Column()
  @Index()
  hash?: string;

  @Allow()
  @ManyToOne(() => User, {
    eager: true,
  })
  user?: User;
}
