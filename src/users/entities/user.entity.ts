import { ApiProperty } from '@nestjs/swagger';
import bcrypt from 'bcryptjs';
import { Exclude, Expose } from 'class-transformer';
import { nanoid } from 'nanoid';
import { AuthProvidersEnum } from 'src/auth/auth-providers.enum';
import { FileEntity } from 'src/files/entities/file.entity';
import { Role } from 'src/roles/entities/role.entity';
import { Status } from 'src/statuses/entities/status.entity';
import { EntityHelper } from 'src/utils/entity-helper';
import {
  AfterLoad,
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

@Entity()
export class User extends EntityHelper {
  @PrimaryColumn('varchar')
  @ApiProperty()
  id: string;

  @BeforeInsert()
  setId() {
    this.id = nanoid();
  }

  // For "string | null" we need to use String type.
  // More info: https://github.com/typeorm/typeorm/issues/2567
  @Column({ type: String, unique: true, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  @ApiProperty({ required: false, type: String, nullable: true })
  email: string | null;

  @Column({ nullable: true })
  @Exclude({ toPlainOnly: true })
  password: string;

  @Exclude({ toPlainOnly: true })
  public previousPassword: string;

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

  @Column({ default: AuthProvidersEnum.email })
  @Expose({ groups: ['me', 'admin'] })
  @ApiProperty()
  provider: string;

  @Index()
  @Column({ type: String, nullable: true })
  @Expose({ groups: ['me', 'admin'] })
  @ApiProperty({ type: String, nullable: true })
  socialId: string | null;

  @Index()
  @Column({ type: String, nullable: true })
  @ApiProperty({ required: false, type: String, nullable: true })
  firstName: string | null;

  @Index()
  @Column({ type: String, nullable: true })
  @ApiProperty({ required: false, type: String, nullable: true })
  lastName: string | null;

  @Index()
  @Column({ type: String, nullable: true })
  @ApiProperty({ required: false, type: String, nullable: true })
  phoneNumber: string | null;

  @ManyToOne(() => FileEntity, {
    eager: true,
  })
  @Exclude({ toPlainOnly: true })
  photo?: FileEntity | null;

  @ManyToOne(() => Role, {
    eager: true,
  })
  @Exclude({ toPlainOnly: true })
  role?: Role | null;

  @ManyToOne(() => Status, {
    eager: true,
  })
  @Exclude({ toPlainOnly: true })
  status?: Status;

  @Column({ type: String, nullable: true })
  @Index()
  @Exclude({ toPlainOnly: true })
  hash: string | null;

  @CreateDateColumn()
  @Exclude({ toPlainOnly: true })
  createdAt: Date;

  @UpdateDateColumn()
  @Exclude({ toPlainOnly: true })
  updatedAt: Date;

  @DeleteDateColumn()
  @Exclude({ toPlainOnly: true })
  deletedAt: Date;
}
