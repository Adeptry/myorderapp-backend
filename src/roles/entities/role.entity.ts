import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';
import { Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Role extends EntityHelper {
  @ApiProperty({ example: 'admin' })
  @PrimaryColumn()
  id: string;
}
