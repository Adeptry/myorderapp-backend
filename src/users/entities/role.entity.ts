import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity, Entity, PrimaryColumn } from 'typeorm';

@Entity('role')
export class RoleEntity extends BaseEntity {
  @ApiProperty({ example: 'admin' })
  @PrimaryColumn({ type: 'varchar' })
  id?: string;
}
