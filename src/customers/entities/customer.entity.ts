import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { nanoid } from 'nanoid';
import { Merchant } from 'src/merchants/entities/merchant.entity';
import { User } from 'src/users/entities/user.entity';
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

@Entity('customer')
export class Customer extends EntityHelper {
  /* Base entity */

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

  /* User */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  userId?: string;

  @ManyToOne(() => User)
  user?: User;

  /* Merchant */

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  merchantId?: string;

  @ManyToOne(() => Merchant)
  merchant?: Merchant;

  /* Square */

  @ApiHideProperty()
  @Exclude()
  @Column('text', { nullable: true })
  squareId?: string | null;
}
