import { ApiProperty } from '@nestjs/swagger';
import { Allow, IsNotEmpty } from 'class-validator';
import { RoleEnum } from '../../roles/roles.enum.js';

export class AuthAppleLoginDto {
  @ApiProperty({ example: 'abc' })
  @IsNotEmpty()
  idToken!: string;

  @Allow()
  @ApiProperty({ required: false, nullable: true })
  firstName?: string;

  @Allow()
  @ApiProperty({ required: false, nullable: true })
  lastName?: string;

  @ApiProperty({
    enum: Object.values(RoleEnum),
  })
  @IsNotEmpty()
  role!: RoleEnum;
}
