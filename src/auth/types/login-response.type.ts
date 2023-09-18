import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity.js';

export class LoginResponseType {
  @ApiProperty()
  token!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty()
  tokenExpires!: number;

  @ApiProperty({ type: User, required: false, nullable: true })
  user!: User;
}
