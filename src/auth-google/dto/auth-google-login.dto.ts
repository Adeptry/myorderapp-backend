import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { RoleEnum } from '../../users/roles.enum.js';

export class AuthGoogleLoginDto {
  @ApiProperty({ example: 'abc' })
  @IsNotEmpty()
  idToken!: string;

  @ApiProperty({
    enum: Object.values(RoleEnum),
  })
  @IsNotEmpty()
  role!: RoleEnum;
}
