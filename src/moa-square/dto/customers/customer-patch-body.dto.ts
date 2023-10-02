import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CustomerPatchBody {
  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  preferredLocationId?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsString()
  @IsOptional()
  preferredSquareCardId?: string;

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
