import { ApiProperty } from '@nestjs/swagger';
import { Entity, PrimaryColumn } from 'typeorm';
import { EntityHelper } from '../../utils/entity-helper.js';

@Entity()
export class Role extends EntityHelper {
  @ApiProperty({ example: 'admin' })
  @PrimaryColumn({ type: 'varchar' })
  id?: string;
}
