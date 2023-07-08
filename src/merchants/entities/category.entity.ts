import { ApiProperty } from '@nestjs/swagger';
import { nanoid } from 'nanoid';
import { EntityHelper } from 'src/utils/entity-helper';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { MoaCatalog } from './catalog.entity';
import { MoaItem } from './item.entity';

@Entity('category')
export class MoaCategory extends EntityHelper {
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

  /* Entity */

  @Column({ nullable: true, default: 0 })
  moaOrdinal?: number;

  @Column({ nullable: true, default: true })
  moaEnabled?: boolean;

  /*
   * Square
   */

  @Column({ nullable: true, unique: true })
  squareId?: string;

  @Column({ type: String, nullable: true })
  name?: string | null;

  /*
   * Relations
   */

  @ManyToOne(() => MoaCatalog, (entity) => entity.categories, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  @ApiProperty()
  catalog?: MoaCatalog;

  @OneToMany(() => MoaItem, (item) => item.category, {
    nullable: true,
    eager: true,
  })
  @ApiProperty()
  items?: MoaItem[];
}
