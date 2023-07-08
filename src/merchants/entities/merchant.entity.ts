import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { nanoid } from 'nanoid';
import { User } from 'src/users/entities/user.entity';
import { EntityHelper } from 'src/utils/entity-helper';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { MoaCatalog } from './catalog.entity';

@Entity('merchant')
export class MoaMerchant extends EntityHelper {
  /* Base entity */

  @PrimaryColumn('varchar')
  moaId?: string;

  @BeforeInsert()
  setMoaId() {
    this.moaId = nanoid();
  }

  @CreateDateColumn({ nullable: true })
  createDate?: Date;

  @UpdateDateColumn({ nullable: true })
  updateDate?: Date;

  @DeleteDateColumn({ nullable: true })
  deleteDate?: Date;

  @VersionColumn({ nullable: true })
  version?: number;

  /* Step 1: User */

  @Column({ nullable: true })
  userId?: string;

  @OneToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn()
  user: User;

  /*
   * Step 2: App info
   */

  @Column({ nullable: true })
  primaryColor?: string;

  @Column({ nullable: true })
  secondaryColor?: string;

  @Column({ nullable: true })
  fontFamily?: string;

  /*
   * Step 3: Square
   */

  @ApiHideProperty()
  @Column({ nullable: true })
  squareAccessToken?: string;

  @ApiHideProperty()
  @Column({ nullable: true })
  squareRefreshToken?: string;

  @ApiHideProperty()
  @Column({ nullable: true })
  squareExpiresAt?: Date;

  @ApiHideProperty()
  @Column({ nullable: true })
  merchantSquareId?: string;

  /*
   * Step 4: Checkout
   */

  @ApiHideProperty()
  @Column({ nullable: true })
  stripeId?: string;

  @ApiHideProperty()
  @Column({ nullable: true })
  stripeCheckoutSessionId?: string;

  /*
   * Catalog
   */

  @Column({ nullable: true })
  catalogMoaId?: string;

  @OneToOne(() => MoaCatalog, (entity) => entity.merchant, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn()
  @ApiProperty()
  catalog?: MoaCatalog;
}
