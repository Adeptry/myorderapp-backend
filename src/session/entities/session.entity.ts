import { Exclude } from 'class-transformer';
import { nanoid } from 'nanoid';
import type { Relation } from 'typeorm';
import {
  BeforeInsert,
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
export class Session extends EntityHelper {
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

  @ManyToOne(() => User, {
    eager: true,
  })
  @Index()
  user?: Relation<User>;
}
