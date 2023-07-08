import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { RoleEnum } from 'src/roles/roles.enum';

export class AuthTwitterLoginDto {
  @ApiProperty({ example: 'abc' })
  @IsNotEmpty()
  accessTokenKey: string;

  @ApiProperty({ example: 'abc' })
  @IsNotEmpty()
  accessTokenSecret: string;

  @ApiProperty({ enum: Object.values(RoleEnum), example: RoleEnum.merchant })
  @IsNotEmpty()
  role: RoleEnum;
}
