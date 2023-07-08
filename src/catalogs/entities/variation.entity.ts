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
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { MoaItem } from './item.entity';

@Entity('variation')
export class MoaVariation extends EntityHelper {
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
  ordinal?: number;

  @Column({ nullable: true, default: true })
  moaEnabled?: boolean;

  /*
   * Square
   */

  @Column({ nullable: true, unique: true })
  squareId?: string;

  @Column({ type: String, nullable: true })
  name?: string | null;

  @Column({ nullable: true })
  priceInCents?: number;

  /*
   * Relations
   */

  @Column({ nullable: true })
  itemMoaId?: string;

  @ManyToOne(() => MoaItem, (entity) => entity.variations, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  @ApiProperty()
  item?: MoaItem;
}
