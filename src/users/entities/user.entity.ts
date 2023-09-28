import { ApiProperty } from '@nestjs/swagger';
import bcrypt from 'bcryptjs';
import { Exclude, Expose } from 'class-transformer';
import { nanoid } from 'nanoid';
import type { Relation } from 'typeorm';
import {
  AfterLoad,
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AuthenticationsProvidersEnum } from '../../authentication/authentication-providers.enum.js';
import { Role } from '../../roles/entities/role.entity.js';
import { Status } from '../../statuses/entities/status.entity.js';

@Entity()
export class UserEntity extends BaseEntity {
  @PrimaryColumn('varchar')
  @ApiProperty()
  id?: string;

  @BeforeInsert()
  setId() {
    this.id = nanoid();
  }

  @CreateDateColumn()
  @Exclude({ toPlainOnly: true })
  createdAt?: Date;

  @UpdateDateColumn()
  @Exclude({ toPlainOnly: true })
  updatedAt?: Date;

  @DeleteDateColumn()
  @Exclude({ toPlainOnly: true })
  deletedAt?: Date;

  // For "string | null" we need to use String type.
  // More info: https://github.com/typeorm/typeorm/issues/2567
  @Column({ type: String, unique: true, nullable: true })
  @ApiProperty({ required: false, type: String, nullable: true })
  email?: string | null;

  @Column({ nullable: true })
  @Exclude({ toPlainOnly: true })
  password?: string;

  @ApiProperty({ required: false, type: String, nullable: true })
  @Column({ nullable: true, type: String })
  phoneNumber?: string | null;

  @Exclude({ toPlainOnly: true })
  public previousPassword?: string;

  @AfterLoad()
  public loadPreviousPassword(): void {
    this.previousPassword = this.password;
  }

  @BeforeInsert()
  @BeforeUpdate()
  async setPassword() {
    if (this.previousPassword !== this.password && this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  @Column({
    type: 'simple-enum',
    nullable: true,
    enum: AuthenticationsProvidersEnum,
    default: AuthenticationsProvidersEnum.email,
  })
  @ApiProperty({
    required: false,
    enum: Object.values(AuthenticationsProvidersEnum),
    nullable: true,
  })
  provider?: string;

  @Index()
  @Column({ type: String, nullable: true })
  @ApiProperty({ required: false, type: String, nullable: true })
  socialId?: string | null;

  @Index()
  @Column({ type: String, nullable: true })
  @ApiProperty({ required: false, type: String, nullable: true })
  firstName?: string | null;

  @Index()
  @Column({ type: String, nullable: true })
  @ApiProperty({ required: false, type: String, nullable: true })
  lastName?: string | null;

  @Column({ type: String, nullable: true })
  @ApiProperty({ required: false, type: String, nullable: true })
  language?: string | null;

  @ManyToOne(() => Role, {
    eager: true,
  })
  @Exclude({ toPlainOnly: true })
  role?: Relation<Role> | null;

  @ManyToOne(() => Status, {
    eager: true,
  })
  @Exclude({ toPlainOnly: true })
  status?: Relation<Status>;

  @Column({ type: String, nullable: true })
  @Index()
  @Exclude({ toPlainOnly: true })
  hash?: string | null;

  @Expose()
  @ApiProperty({ required: false, type: String, nullable: true })
  get fullName(): string | undefined {
    if (!this.firstName && !this.lastName) {
      return undefined;
    } else {
      return `${this.firstName} ${this.lastName}`;
    }
  }
}
