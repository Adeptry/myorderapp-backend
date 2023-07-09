import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { nanoid } from 'nanoid';
import { AppConfig } from 'src/app-config/entities/app-config.entity';
import { MoaCatalog } from 'src/catalogs/entities/catalog.entity';
import { MoaLocation } from 'src/locations/entities/location.entity';
import { User } from 'src/users/entities/user.entity';
import { EntityHelper } from 'src/utils/entity-helper';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

@Entity('merchant')
export class MoaMerchant extends EntityHelper {
  /* Base entity */

  @ApiProperty({ required: false })
  @PrimaryColumn('varchar')
  moaId?: string;

  @BeforeInsert()
  setMoaId() {
    this.moaId = nanoid();
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

  /* Step 1: User */

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  userId?: string;

  @OneToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn()
  user: User;

  /*
   * Step 2: App config
   */

  @OneToOne(() => AppConfig, (entity) => entity.merchant, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @ApiProperty({ type: () => AppConfig, required: false })
  appConfig?: AppConfig;

  /*
   * Step 3: Square
   */

  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  @Column({ nullable: true })
  squareAccessToken?: string;

  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  @Column({ nullable: true })
  squareRefreshToken?: string;

  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  @Column({ nullable: true })
  squareExpiresAt?: Date;

  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  @Column({ nullable: true })
  merchantSquareId?: string;

  /*
   * Step 4: Checkout
   */

  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  @Column({ nullable: true })
  stripeId?: string;

  @ApiHideProperty()
  @Column({ nullable: true })
  stripeCheckoutSessionId?: string;

  /*
   * Catalog
   */

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  catalogMoaId?: string;

  @OneToOne(() => MoaCatalog, (entity) => entity.merchant, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn()
  @ApiProperty({ type: () => MoaCatalog, required: false })
  catalog?: MoaCatalog;

  /*
   * Locations
   */

  @OneToMany(() => MoaLocation, (entity) => entity.merchant, {
    nullable: true,
  })
  @ApiProperty({ type: () => MoaLocation, required: false, isArray: true })
  locations?: MoaLocation[];

  /*
   * Firebase
   */

  @Exclude({ toPlainOnly: true })
  @Column('simple-json', { nullable: true })
  firebaseAppOptions?: Record<string, any>;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  firebaseDatabaseUrl?: string;
}
