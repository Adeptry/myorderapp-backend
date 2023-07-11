import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { RoleNameEnum } from 'src/roles/roles.enum';

export class AuthFacebookLoginDto {
  @ApiProperty({ example: 'abc' })
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty({
    enum: Object.values(RoleNameEnum),
  })
  @IsNotEmpty()
  role: RoleNameEnum;
}
