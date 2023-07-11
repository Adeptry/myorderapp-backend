import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';
import { Entity, PrimaryColumn } from 'typeorm';
import { RoleNameEnum } from '../roles.enum';

@Entity()
export class Role extends EntityHelper {
  @ApiProperty({ example: 'admin' })
  @PrimaryColumn({ type: 'simple-enum', enum: RoleNameEnum })
  id: string;
}
