import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../users/entities/user.entity.js';

export class AuthenticationResponse {
  @ApiProperty()
  token!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty()
  tokenExpires!: number;

  @ApiProperty({ type: UserEntity, required: false, nullable: true })
  user!: UserEntity;
}
