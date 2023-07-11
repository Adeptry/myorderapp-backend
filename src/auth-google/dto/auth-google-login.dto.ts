import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { RoleNameEnum } from 'src/roles/roles.enum';

export class AuthGoogleLoginDto {
  @ApiProperty({ example: 'abc' })
  @IsNotEmpty()
  idToken: string;

  @ApiProperty({
    enum: Object.values(RoleNameEnum),
  })
  @IsNotEmpty()
  role: RoleNameEnum;
}
