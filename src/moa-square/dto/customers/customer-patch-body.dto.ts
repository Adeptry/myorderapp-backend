import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CustomerPatchBody {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  preferredLocationId?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  preferredSquareCardId?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsBoolean()
  @IsOptional()
  mailNotifications?: boolean;

  @ApiProperty({ required: false, nullable: true })
  @IsBoolean()
  @IsOptional()
  messageNotifications?: boolean;

  @ApiProperty({ required: false, nullable: true })
  @IsBoolean()
  @IsOptional()
  pushNotifications?: boolean;

  @ApiProperty({
    type: String,
    example: 'John',
    required: false,
    nullable: true,
  })
  @IsOptional()
  firstName?: string | null;

  @ApiProperty({
    type: String,
    example: 'Doe',
    required: false,
    nullable: true,
  })
  @IsOptional()
  lastName?: string | null;

  @ApiProperty({
    type: String,
    required: false,
    nullable: true,
  })
  @IsOptional()
  phoneNumber?: string | null;
}
