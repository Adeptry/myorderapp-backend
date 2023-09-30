import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('status')
export class StatusEntity extends BaseEntity {
  @ApiProperty({ example: 1 })
  @PrimaryColumn()
  id?: number;

  @Allow()
  @ApiProperty({ example: 'Active' })
  @Column()
  name?: string;
}
