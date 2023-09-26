import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Status extends BaseEntity {
  @ApiProperty({ example: 1 })
  @PrimaryColumn()
  id?: number;

  @Allow()
  @ApiProperty({ example: 'Active' })
  @Column()
  name?: string;
}
