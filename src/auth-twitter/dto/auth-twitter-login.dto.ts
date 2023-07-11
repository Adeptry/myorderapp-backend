import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { RoleNameEnum } from 'src/roles/roles.enum';

export class AuthTwitterLoginDto {
  @ApiProperty({ example: 'abc' })
  @IsNotEmpty()
  accessTokenKey: string;

  @ApiProperty({ example: 'abc' })
  @IsNotEmpty()
  accessTokenSecret: string;

  @ApiProperty({
    enum: Object.values(RoleNameEnum),
  })
  @IsNotEmpty()
  role: RoleNameEnum;
}
