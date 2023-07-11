import { ApiProperty } from '@nestjs/swagger';
import { Allow, IsNotEmpty } from 'class-validator';
import { RoleNameEnum } from 'src/roles/roles.enum';

export class AuthAppleLoginDto {
  @ApiProperty({ example: 'abc' })
  @IsNotEmpty()
  idToken: string;

  @Allow()
  @ApiProperty({ required: false })
  firstName?: string;

  @Allow()
  @ApiProperty({ required: false })
  lastName?: string;

  @ApiProperty({
    enum: Object.values(RoleNameEnum),
  })
  @IsNotEmpty()
  role: RoleNameEnum;
}
