import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { RoleEnum } from 'src/roles/roles.enum';

export class AuthGoogleLoginDto {
  @ApiProperty({ example: 'abc' })
  @IsNotEmpty()
  idToken: string;

  @ApiProperty({ enum: Object.values(RoleEnum), example: RoleEnum.merchant })
  @IsNotEmpty()
  role: RoleEnum;
}
