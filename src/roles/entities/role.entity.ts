import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Role extends BaseEntity {
  @ApiProperty({ example: 'admin' })
  @PrimaryColumn({ type: 'varchar' })
  id?: string;
}
